import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

app = FastAPI(title="Happy Cake API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIT_TOKEN = os.environ.get("INTERNAL_AUDIT_TOKEN", "")
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CONVERSATIONS: dict[str, list[dict]] = {}
PENDING_ORDERS: dict[str, dict] = {}


@app.get("/health")
async def health():
    return {"ok": True, "service": "happycake-api", "version": "1.0.0"}


@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    message = body.get("message", "").strip()
    conversation_id = body.get("conversation_id") or str(uuid.uuid4())
    channel = body.get("channel", "website")

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

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
            parsed = json.loads(reply_text) if isinstance(reply_text, str) and reply_text.strip().startswith("{") else {}
            if parsed:
                reply_text = parsed.get("reply", reply_text)
                intent = parsed.get("intent", "general")
                escalation_required = parsed.get("escalation_required", False)
                order_id = parsed.get("order_id")
                order_total_cents = parsed.get("order_total_cents", 0)
                suggested_actions = parsed.get("suggested_actions", [])
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


WEBHOOK_SEEN: set[str] = set()


@app.post("/webhooks/whatsapp")
async def webhook_whatsapp(request: Request):
    body = await request.json()
    event_id = body.get("event_id") or str(uuid.uuid4())
    if event_id in WEBHOOK_SEEN:
        return {"status": "duplicate"}
    WEBHOOK_SEEN.add(event_id)
    if len(WEBHOOK_SEEN) > 10000:
        WEBHOOK_SEEN.clear()

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    message = body.get("message", body.get("text", ""))
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
    body = await request.json()
    event_id = body.get("event_id") or str(uuid.uuid4())
    if event_id in WEBHOOK_SEEN:
        return {"status": "duplicate"}
    WEBHOOK_SEEN.add(event_id)

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    message = body.get("message", body.get("text", ""))
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
    try:
        data = await call_mcp("square_search_catalog", {"query": slug})
        return data
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/agents/order-intent")
async def agents_order_intent(request: Request):
    body = await request.json()
    idempotency_key = request.headers.get("Idempotency-Key", str(uuid.uuid4()))
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"

    write_event(trace_id, "api", "order_intent", {
        "idempotency_key": idempotency_key,
        "body": body,
    })

    product = body.get("product", "")
    quantity = body.get("quantity", 1)
    pickup_date = body.get("pickup_date", "")
    pickup_time = body.get("pickup_time", "")
    customer_name = body.get("customer_name", "")
    notes = body.get("notes", "")

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


@app.get("/internal/audit")
async def audit_endpoint(
    trace_id: str = Query(default=""),
    token: str = Query(default=""),
):
    if not AUDIT_TOKEN or token != AUDIT_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid audit token")

    if trace_id:
        events = read_trace(trace_id)
    else:
        events = read_recent(50)

    return {"events": events, "count": len(events)}


@app.get("/internal/pending-orders")
async def pending_orders(token: str = Query(default="")):
    if not AUDIT_TOKEN or token != AUDIT_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid audit token")
    return {"orders": list(PENDING_ORDERS.values())}
