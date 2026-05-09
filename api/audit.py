import json
import os
import time
import fcntl
from pathlib import Path

AUDIT_DIR = Path(__file__).resolve().parent.parent / "logs"
AUDIT_FILE = AUDIT_DIR / "audit.jsonl"


def write_event(trace_id: str, agent: str, event: str, payload: dict | None = None):
    AUDIT_DIR.mkdir(exist_ok=True)
    entry = {
        "trace_id": trace_id,
        "agent": agent,
        "event": event,
        "payload": payload or {},
        "created_at": time.time(),
        "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(AUDIT_FILE, "a") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(json.dumps(entry) + "\n")
        fcntl.flock(f, fcntl.LOCK_UN)


def read_trace(trace_id: str) -> list[dict]:
    if not AUDIT_FILE.exists():
        return []
    events = []
    with open(AUDIT_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            entry = json.loads(line)
            if entry.get("trace_id") == trace_id:
                events.append(entry)
    return sorted(events, key=lambda e: e["created_at"])


def read_recent(limit: int = 50) -> list[dict]:
    if not AUDIT_FILE.exists():
        return []
    events = []
    with open(AUDIT_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            events.append(json.loads(line))
    return events[-limit:]
