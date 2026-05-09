#!/usr/bin/env python3
"""Pretty-print the most recent demo trace from audit.jsonl."""

import json
import sys
from datetime import datetime
from pathlib import Path

AUDIT_FILE = Path(__file__).resolve().parent.parent / "logs" / "audit.jsonl"


def main():
    if not AUDIT_FILE.exists():
        print("No audit.jsonl found. Run a demo first.")
        sys.exit(1)

    events = []
    with open(AUDIT_FILE) as f:
        for line in f:
            line = line.strip()
            if line:
                events.append(json.loads(line))

    if not events:
        print("No events in audit.jsonl.")
        sys.exit(1)

    trace_ids = {}
    for e in events:
        tid = e.get("trace_id", "")
        if tid not in trace_ids:
            trace_ids[tid] = []
        trace_ids[tid].append(e)

    target = sys.argv[1] if len(sys.argv) > 1 else list(trace_ids.keys())[-1]
    trace_events = trace_ids.get(target, [])

    if not trace_events:
        print(f"No events for trace_id: {target}")
        print(f"Available traces: {', '.join(list(trace_ids.keys())[-5:])}")
        sys.exit(1)

    print(f"\n📋 Trace: {target}")
    print(f"   Events: {len(trace_events)}")
    print("=" * 60)

    for i, e in enumerate(sorted(trace_events, key=lambda x: x["created_at"])):
        ts = e.get("iso", datetime.fromtimestamp(e["created_at"]).isoformat())
        agent = e.get("agent", "?")
        event = e.get("event", "?")
        payload = e.get("payload", {})

        print(f"\n  [{i+1}] {ts}")
        print(f"      Agent: {agent}")
        print(f"      Event: {event}")
        if payload:
            for k, v in payload.items():
                val = str(v)[:100]
                print(f"      {k}: {val}")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
