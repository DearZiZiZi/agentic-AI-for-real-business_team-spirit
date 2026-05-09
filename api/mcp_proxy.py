import os
import httpx

MCP_BASE_URL = os.environ.get("MCP_BASE_URL", "https://www.steppebusinessclub.com/api/mcp")
TEAM_TOKEN = os.environ.get("TEAM_TOKEN", "")


async def call_mcp(tool_name: str, arguments: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            MCP_BASE_URL,
            json={
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments or {},
                },
                "id": 1,
            },
            headers={"X-Team-Token": TEAM_TOKEN},
        )
        resp.raise_for_status()
        data = resp.json()
        if "result" in data:
            return data["result"]
        if "error" in data:
            return {"error": data["error"]}
        return data
