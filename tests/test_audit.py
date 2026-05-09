import json
import os
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest


def test_write_and_read_event():
    with tempfile.TemporaryDirectory() as tmpdir:
        audit_file = Path(tmpdir) / "audit.jsonl"
        audit_dir = Path(tmpdir)
        with patch("api.audit.AUDIT_FILE", audit_file), \
             patch("api.audit.AUDIT_DIR", audit_dir):
            from api.audit import write_event, read_trace

            write_event("trace-1", "test", "event_a", {"key": "val"})
            write_event("trace-1", "test", "event_b", {"key": "val2"})
            write_event("trace-2", "test", "event_c", {})

            events = read_trace("trace-1")
            assert len(events) == 2
            assert events[0]["event"] == "event_a"
            assert events[1]["event"] == "event_b"

            events2 = read_trace("trace-2")
            assert len(events2) == 1


def test_read_trace_no_file():
    with patch("api.audit.AUDIT_FILE", Path("/nonexistent/path.jsonl")):
        from api.audit import read_trace
        assert read_trace("anything") == []
