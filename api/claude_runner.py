import json
import os
import subprocess
import tempfile
import time
from pathlib import Path

from api.audit import write_event

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CLAUDE_BIN = os.environ.get("CLAUDE_BIN", "claude")
CLAUDE_TIMEOUT = int(os.environ.get("CLAUDE_TIMEOUT_S", "60"))
TEAM_TOKEN = os.environ.get("TEAM_TOKEN", "")


def _get_mcp_config_path() -> str:
    """Create a runtime MCP config with the actual token substituted."""
    config = {
        "mcpServers": {
            "happycake": {
                "url": "https://www.steppebusinessclub.com/api/mcp",
                "headers": {
                    "X-Team-Token": TEAM_TOKEN,
                },
            }
        }
    }
    config_path = PROJECT_ROOT / ".claude" / "mcp_runtime.json"
    config_path.write_text(json.dumps(config, indent=2))
    return str(config_path)


def run(prompt: str, *, trace_id: str, timeout_s: int | None = None) -> dict:
    timeout_s = timeout_s or CLAUDE_TIMEOUT

    write_event(trace_id, "claude_runner", "invoke", {"prompt_length": len(prompt)})

    mcp_config = _get_mcp_config_path()

    try:
        result = subprocess.run(
            [
                CLAUDE_BIN, "-p", prompt,
                "--output-format", "json",
                "--mcp-config", mcp_config,
                "--cwd", str(PROJECT_ROOT),
            ],
            capture_output=True,
            text=True,
            timeout=timeout_s,
            cwd=str(PROJECT_ROOT),
        )

        if result.returncode != 0:
            write_event(trace_id, "claude_runner", "error", {
                "returncode": result.returncode,
                "stderr": result.stderr[:500],
            })
            return {
                "ok": False,
                "error": result.stderr[:500] or "Claude CLI returned non-zero",
                "reply": "Apologies — we're having a moment. Let me get the owner to help you.",
            }

        try:
            parsed = json.loads(result.stdout)
        except json.JSONDecodeError:
            parsed = {"raw_output": result.stdout[:2000]}

        write_event(trace_id, "claude_runner", "response", {
            "output_length": len(result.stdout),
            "has_result": "result" in parsed,
        })

        reply_text = ""
        if isinstance(parsed, dict):
            reply_text = parsed.get("result", parsed.get("raw_output", str(parsed)))
        elif isinstance(parsed, str):
            reply_text = parsed
        else:
            reply_text = str(parsed)

        return {"ok": True, "reply": reply_text, "raw": parsed}

    except subprocess.TimeoutExpired:
        write_event(trace_id, "claude_runner", "timeout", {"timeout_s": timeout_s})
        return {
            "ok": False,
            "error": "timeout",
            "reply": "We need a moment — the kitchen is busy. We'll get back to you shortly.",
        }
    except Exception as e:
        write_event(trace_id, "claude_runner", "exception", {"error": str(e)})
        return {
            "ok": False,
            "error": str(e),
            "reply": "Something went wrong on our end. Please try again in a moment.",
        }
