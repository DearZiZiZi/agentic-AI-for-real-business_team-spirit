import hashlib
import hmac
import json
import logging
import os
import re
import time
import uuid
from collections import defaultdict, deque
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security

load_dotenv()

from api.audit import read_recent, read_trace, write_event
from api.claude_runner import run as claude_run
from api.mcp_proxy import call_mcp
from api.prompts import (
    build_briefing_prompt,
    build_chat_prompt,
    build_marketing_prompt,
    build_order_decision_prompt,
)
from api.tiers import Tier, classify

API_VERSION = "1.2.2"

logger = logging.getLogger("happycake.api")

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Security configuration — all values MUST come from environment variables.
# ---------------------------------------------------------------------------
_RAW_AUDIT_TOKEN: str = os.environ.get("INTERNAL_AUDIT_TOKEN", "")
if not _RAW_AUDIT_TOKEN:
    raise RuntimeError(
        "INTERNAL_AUDIT_TOKEN environment variable is not set. "
        "Set a strong random secret before starting the server."
    )
AUDIT_TOKEN: str = _RAW_AUDIT_TOKEN

# Allowed origins for CORS
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins
    else []  # empty → CORS middleware blocks all cross-origin requests
)

# ---------------------------------------------------------------------------
# Input limits
# ---------------------------------------------------------------------------
MAX_MESSAGE_BYTES = 4_096
MAX_SLUG_LENGTH   = 120
_SAFE_SLUG_RE     = re.compile(r"^[a-zA-Z0-9_\-]+$")

# ---------------------------------------------------------------------------
# Rate limiting — simple in-process token-bucket per remote IP.
# Replace with a Redis-backed solution (e.g. slowapi) for multi-worker use.
# ---------------------------------------------------------------------------
_RATE_LIMIT_WINDOW_SECONDS = 60
_RATE_LIMIT_MAX_REQUESTS   = 1000    # per IP per window | 1000 requests per minute*

_rate_buckets: dict[str, deque] = defaultdict(deque)


def _check_rate_limit(ip: str) -> None:
    """Raise HTTP 429 if the IP has exceeded the request quota."""
    now = time.monotonic()
    bucket = _rate_buckets[ip]
    cutoff = now - _RATE_LIMIT_WINDOW_SECONDS
    while bucket and bucket[0] < cutoff:
        bucket.popleft()
    if len(bucket) >= _RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down.",
        )
    bucket.append(now)
    # Prevent unbounded growth across IPs
    if len(_rate_buckets) > 50_000:
        _rate_buckets.clear()


def _client_ip(request: Request) -> str:
    """Return the best-effort client IP, respecting a trusted proxy header."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------------------
# Constant-time token verification
# ---------------------------------------------------------------------------
def _verify_audit_token(supplied: str) -> None:
    """
    Compare the supplied token against AUDIT_TOKEN in constant time to
    prevent timing-based side-channel attacks. Raises HTTP 401 on failure.
    """
    if not hmac.compare_digest(
        hashlib.sha256(supplied.encode()).digest(),
        hashlib.sha256(AUDIT_TOKEN.encode()).digest(),
    ):
        raise HTTPException(status_code=401, detail="Invalid audit token")


# ---------------------------------------------------------------------------
# Bounded in-memory stores — prevent memory exhaustion (DoS)
# ---------------------------------------------------------------------------
_CONVERSATION_MAX_ENTRIES = 10_000
_PENDING_ORDERS_MAX       = 5_000


class _BoundedDict(dict):
    """A dict that evicts the oldest entry when its size cap is reached."""

    def __init__(self, maxsize: int) -> None:
        super().__init__()
        self._maxsize = maxsize
        self._keys: deque = deque()

    def __setitem__(self, key, value):
        if key not in self:
            if len(self) >= self._maxsize:
                oldest = self._keys.popleft()
                super().pop(oldest, None)
            self._keys.append(key)
        super().__setitem__(key, value)


CONVERSATIONS:  _BoundedDict = _BoundedDict(_CONVERSATION_MAX_ENTRIES)
PENDING_ORDERS: _BoundedDict = _BoundedDict(_PENDING_ORDERS_MAX)

# Webhook dedup — capped LRU-style set; evicts oldest entry, not everything
_WEBHOOK_SEEN_MAX    = 20_000
_webhook_seen_order: deque = deque()
WEBHOOK_SEEN: set[str] = set()


def _webhook_already_seen(event_id: str) -> bool:
    """Return True if event_id is a duplicate; register it otherwise."""
    if event_id in WEBHOOK_SEEN:
        return True
    WEBHOOK_SEEN.add(event_id)
    _webhook_seen_order.append(event_id)
    while len(WEBHOOK_SEEN) > _WEBHOOK_SEEN_MAX:
        evict = _webhook_seen_order.popleft()
        WEBHOOK_SEEN.discard(evict)
    return False


DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Happy Cake API", version=API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=bool(ALLOWED_ORIGINS),  # only True when origins are explicit
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Idempotency-Key"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"ok": True, "service": "happycake-api", "version": API_VERSION}


@app.post("/api/chat")
async def chat(request: Request):
    _check_rate_limit(_client_ip(request))

    body = await request.json()
    message = body.get("message", "")
    if not isinstance(message, str):
        raise HTTPException(status_code=400, detail="message must be a string")
    message = message.strip()

    # Enforce maximum message size to prevent prompt-stuffing / DoS
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    if len(message.encode()) > MAX_MESSAGE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"message exceeds maximum length of {MAX_MESSAGE_BYTES} bytes",
        )

    conversation_id = body.get("conversation_id") or str(uuid.uuid4())
    channel = body.get("channel", "website")

    # Sanitise channel to an allowlist to prevent injection into prompts
    if channel not in {"website", "whatsapp", "instagram", "api"}:
        channel = "website"

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    write_event(trace_id, "api", "chat_request", {
        "conversation_id": conversation_id,
        "channel": channel,
        "message_length": len(message),
    })

    history = CONVERSATIONS.get(conversation_id, [])
    history.append({"role": "customer", "content": message})

    prompt = build_chat_prompt(message, conversation_id, channel, history)
    result = claude_run(prompt, trace_id=trace_id)

    reply_text = result.get("reply", "I'm here to help! Could you tell me more?")
    intent = "general"
    escalation_required = False
    order_id = None
    order_total_cents = 0
    suggested_actions = []

    if result.get("ok"):
        try:
            parsed = (
                json.loads(reply_text)
                if isinstance(reply_text, str) and reply_text.strip().startswith("{")
                else {}
            )
            if parsed:
                reply_text          = parsed.get("reply", reply_text)
                intent              = parsed.get("intent", "general")
                escalation_required = parsed.get("escalation_required", False)
                order_id            = parsed.get("order_id")
                order_total_cents   = parsed.get("order_total_cents", 0)
                suggested_actions   = parsed.get("suggested_actions", [])
        except (json.JSONDecodeError, TypeError):
            pass

    tier, tier_reason = classify(
        intent=intent,
        order_total_cents=order_total_cents,
        customer_message=message,
    )

    write_event(trace_id, "api", "tier_classified", {
        "tier": tier.value,
        "reason": tier_reason,
        "intent": intent,
    })

    if tier == Tier.C:
        escalation_required = True
        if order_id:
            PENDING_ORDERS[order_id] = {
                "order_id": order_id,
                "conversation_id": conversation_id,
                "channel": channel,
                "tier": "C",
                "reason": tier_reason,
                "message": message,
                "trace_id": trace_id,
            }

    history.append({"role": "assistant", "content": reply_text})
    CONVERSATIONS[conversation_id] = history[-20:]

    write_event(trace_id, "api", "chat_response", {
        "reply_length": len(reply_text),
        "tier": tier.value,
        "escalation": escalation_required,
    })

    return JSONResponse({
        "reply": reply_text,
        "conversation_id": conversation_id,
        "trace_id": trace_id,
        "tier": tier.value,
        "escalation_required": escalation_required,
        "suggested_actions": suggested_actions,
    })


@app.post("/webhooks/whatsapp")
async def webhook_whatsapp(request: Request):
    _check_rate_limit(_client_ip(request))

    body = await request.json()
    event_id = body.get("event_id") or str(uuid.uuid4())

    if _webhook_already_seen(event_id):
        return {"status": "duplicate"}

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    message = body.get("message", body.get("text", ""))
    if len(str(message).encode()) > MAX_MESSAGE_BYTES:
        raise HTTPException(status_code=400, detail="message too large")

    sender = body.get("sender", body.get("from", "unknown"))
    conversation_id = f"wa_{sender}"

    write_event(trace_id, "webhook", "whatsapp_inbound", {
        "event_id": event_id,
        "sender": sender,
    })

    history = CONVERSATIONS.get(conversation_id, [])
    history.append({"role": "customer", "content": message})

    prompt = build_chat_prompt(message, conversation_id, "whatsapp", history)
    prompt += "\n\nIMPORTANT: After composing your reply, also call whatsapp_send_message to send it to the customer."

    result = claude_run(prompt, trace_id=trace_id)
    reply_text = result.get("reply", "Thanks for reaching out! Let me look into that.")

    history.append({"role": "assistant", "content": reply_text})
    CONVERSATIONS[conversation_id] = history[-20:]

    write_event(trace_id, "webhook", "whatsapp_response", {"reply_length": len(reply_text)})
    return {"status": "ok", "trace_id": trace_id}


@app.post("/webhooks/instagram")
async def webhook_instagram(request: Request):
    _check_rate_limit(_client_ip(request))

    body = await request.json()
    event_id = body.get("event_id") or str(uuid.uuid4())

    if _webhook_already_seen(event_id):
        return {"status": "duplicate"}

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    message = body.get("message", body.get("text", ""))
    if len(str(message).encode()) > MAX_MESSAGE_BYTES:
        raise HTTPException(status_code=400, detail="message too large")

    sender = body.get("sender", body.get("from", "unknown"))
    conversation_id = f"ig_{sender}"

    write_event(trace_id, "webhook", "instagram_inbound", {
        "event_id": event_id,
        "sender": sender,
    })

    history = CONVERSATIONS.get(conversation_id, [])
    history.append({"role": "customer", "content": message})

    prompt = build_chat_prompt(message, conversation_id, "instagram", history)
    prompt += "\n\nIMPORTANT: After composing your reply, also call instagram_send_dm to send it to the customer."

    result = claude_run(prompt, trace_id=trace_id)
    reply_text = result.get("reply", "Thanks for the DM! Let me check on that.")

    history.append({"role": "assistant", "content": reply_text})
    CONVERSATIONS[conversation_id] = history[-20:]

    write_event(trace_id, "webhook", "instagram_response", {"reply_length": len(reply_text)})
    return {"status": "ok", "trace_id": trace_id}


@app.get("/api/agents/catalog")
async def agents_catalog():
    try:
        data = await call_mcp("square_list_catalog")
        return data
    except Exception as e:
        catalog_file = DATA_DIR / "catalog_seed.json"
        if catalog_file.exists():
            return json.loads(catalog_file.read_text())
        return {"error": str(e), "fallback": True}


@app.get("/api/agents/availability")
async def agents_availability(date: str = Query(default="")):
    # Validate date format to prevent injection into downstream MCP calls
    if date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")
    try:
        args = {"date": date} if date else {}
        data = await call_mcp("kitchen_get_production_summary", args)
        return data
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/agents/policies")
async def agents_policies():
    policies_file = DATA_DIR / "policies.md"
    if policies_file.exists():
        return {"policies": policies_file.read_text()}
    return {"policies": "Contact us for our current policies."}


@app.get("/api/agents/products/{slug}")
async def agents_product(slug: str):
    # Allowlist slug characters and cap length to prevent injection
    if len(slug) > MAX_SLUG_LENGTH or not _SAFE_SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail="Invalid product slug. Use only letters, numbers, hyphens, and underscores.",
        )
    try:
        data = await call_mcp("square_search_catalog", {"query": slug})
        return data
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/agents/order-intent")
async def agents_order_intent(request: Request):
    _check_rate_limit(_client_ip(request))

    body = await request.json()
    idempotency_key = request.headers.get("Idempotency-Key", str(uuid.uuid4()))
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"

    write_event(trace_id, "api", "order_intent", {
        "idempotency_key": idempotency_key,
        "body": body,
    })

    product       = str(body.get("product", ""))[:200]
    quantity      = body.get("quantity", 1)
    pickup_date   = body.get("pickup_date", "")
    pickup_time   = body.get("pickup_time", "")
    customer_name = str(body.get("customer_name", ""))[:200]
    notes         = str(body.get("notes", ""))[:500]

    # Validate date/time shapes before embedding in the prompt
    if pickup_date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(pickup_date)):
        raise HTTPException(status_code=400, detail="pickup_date must be YYYY-MM-DD")
    if pickup_time and not re.fullmatch(r"\d{2}:\d{2}", str(pickup_time)):
        raise HTTPException(status_code=400, detail="pickup_time must be HH:MM")

    prompt = f"""A customer wants to place an order via the agent-friendly API.

Product: {product}
Quantity: {quantity}
Pickup date: {pickup_date}
Pickup time: {pickup_time}
Customer: {customer_name}
Notes: {notes}

Steps:
1. Search the catalog for this product using square_search_catalog.
2. Check kitchen capacity for the date using kitchen_get_production_summary.
3. If available, create the order via square_create_order (status: pending) and kitchen_create_ticket (status: pending).
4. Return the order details.

Respond with ONLY a JSON object:
{{
  "order_id": "...",
  "product": "...",
  "total_cents": 0,
  "pickup": "{pickup_date} {pickup_time}",
  "status": "pending",
  "message": "..."
}}"""

    result = claude_run(prompt, trace_id=trace_id)

    write_event(trace_id, "api", "order_intent_result", {"ok": result.get("ok")})

    return JSONResponse({
        "trace_id": trace_id,
        "result": result.get("reply", "Order received, processing..."),
    })


# ---------------------------------------------------------------------------
# Internal endpoints — token delivered via Authorization header (Bearer),
# NOT a query parameter, to keep secrets out of server logs and URL history.
# ---------------------------------------------------------------------------

@app.get("/internal/audit")
async def audit_endpoint(
    request: Request,
    trace_id: str = Query(default=""),
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    _verify_audit_token(credentials.credentials) 

    if trace_id:
        events = read_trace(trace_id)
    else:
        events = read_recent(50)

    return {"events": events, "count": len(events)}


@app.get("/internal/pending-orders")
async def pending_orders(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    _verify_audit_token(credentials.credentials)
    return {"orders": list(PENDING_ORDERS.values())}