import json
import os
import time
from pathlib import Path

# Platform-specific imports
if os.name == "nt":
    import msvcrt
else:
    import fcntl


AUDIT_DIR = Path(__file__).resolve().parent.parent / "logs"
AUDIT_FILE = AUDIT_DIR / "audit.jsonl"


def lock_file(f):
    if os.name == "nt":
        f.seek(0)
        msvcrt.locking(f.fileno(), msvcrt.LK_LOCK, 1)
    else:
        fcntl.flock(f, fcntl.LOCK_EX)


def unlock_file(f):
    if os.name == "nt":
        f.seek(0)
        msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
    else:
        fcntl.flock(f, fcntl.LOCK_UN)


def write_event(
    trace_id: str,
    agent: str,
    event: str,
    payload: dict | None = None
):
    AUDIT_DIR.mkdir(exist_ok=True)

    entry = {
        "trace_id": trace_id,
        "agent": agent,
        "event": event,
        "payload": payload or {},
        "created_at": time.time(),
        "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    with open(AUDIT_FILE, "a", encoding="utf-8") as f:
        lock_file(f)

        try:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            f.flush()

            # Ensure data is written to disk
            os.fsync(f.fileno())

        finally:
            unlock_file(f)


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
