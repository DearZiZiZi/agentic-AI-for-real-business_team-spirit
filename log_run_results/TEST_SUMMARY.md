# HappyCake System — Test Run Results

**Date:** 2026-05-10
**Branch:** claude/gallant-blackwell-f71b02
**Environment:** macOS, Python 3.13.12, Node 20+, Claude Code CLI

---

## 1. Unit Tests

All 17 tests pass:
- `tests/test_tiers.py` — 15 tests (Tier A/B/C boundary cases)
- `tests/test_audit.py` — 2 tests (write_event, read_trace)

```
============================== 17 passed in 0.02s ==============================
```

---

## 2. API Endpoints

| Endpoint | Status | Notes |
|---|---|---|
| GET /health | 200 OK | `{"ok":true,"service":"happycake-api","version":"1.0.0"}` |
| GET /api/agents/catalog | 200 OK | Returns 5 products from MCP sandbox |
| GET /api/agents/availability | 200 OK | Returns kitchen capacity (420 min available) |
| GET /api/agents/policies | 200 OK | Returns HappyCake policies markdown |
| POST /api/chat | 200 OK | Full Claude CLI agent invocation works |
| POST /api/agents/order-intent | 200 OK | Creates Square order + kitchen ticket |
| GET /internal/audit | 200 OK | Returns JSONL audit events with trace_id |

---

## 3. Claude Code CLI Integration

### 3.1 MCP Catalog Query
```
claude -p "Call square_list_catalog..." --mcp-config .mcp.json --dangerously-skip-permissions
```
Result: Successfully returned 5 products with prices:
- Honey cake slice — $8.50
- Whole honey cake — $55.00
- Pistachio roll — $9.50
- Custom birthday cake — $95.00
- Office dessert box — $120.00

### 3.2 AI Customer Order
```
claude -p "Order a whole honey cake for Saturday May 16 at 3 PM pickup. Customer: Test Buyer. Use http://localhost:8080/api/agents."
```
Result: Order `sq_order_1778409477006` placed, kitchen ticket `kt_1778409480038` created, status pending.

---

## 4. Chat Scenarios

### 4.1 Browse (Tier A)
- Input: "What cakes do you have available? I need something for a birthday."
- Result: Agent called `square_list_catalog` + `kitchen_get_production_summary`, replied in brand voice with real prices.
- Tier: A (correct — informational)

### 4.2 Complaint + Manager Request (Tier C)
- Input: "I want to talk to a manager please. My cake was terrible yesterday."
- Result: Agent responded empathetically, flagged for escalation.
- Tier: C (correct — complaint + human request)
- `escalation_required: true`

### 4.3 Non-Standard SKU Order (Tier C detection)
- Input: "I'll take the 8-inch chocolate cake for Saturday 3 PM pickup"
- Result: Agent correctly identified that chocolate cake is not in catalog, offered alternatives (honey cake, custom birthday cake), flagged for escalation.

---

## 5. Demo Script

Full `scripts/demo.sh` ran successfully:
1. Health check passed
2. Catalog browsed (5 products)
3. Availability checked (420 min capacity)
4. Customer chat (browse intent, Tier A)
5. Follow-up order (escalated for non-standard SKU)
6. AI customer order via agent API (order created + kitchen ticket)

Trace ID: `trace_c7b21b4a90f0`

---

## 6. Audit Trail

All events logged to `logs/audit.jsonl` with:
- `trace_id` correlation across request lifecycle
- Events: `chat_request`, `invoke`, `response`, `tier_classified`, `chat_response`
- ISO timestamps
- Agent attribution (`api`, `claude_runner`)

---

## 7. Website

- Homepage renders with dark blue (hb-900) hero, "HappyCake" wordmark
- Catalog page shows all 5 products with correct prices
- Agent-friendly files served: `/agents.txt`, `/.well-known/ai-plugin.json`, `/openapi.yaml`
- JSON-LD structured data on product pages
- Chat widget available (bottom-right floating button)

---

## 8. Brand Compliance

- Brand name: "HappyCake" (one word, two capitals) used consistently
- Colors: happy-blue (#0E2A3C/#1B4868) + cream (#FBF6E8) palette
- Typography: Cormorant Garamond (display) + Inter (body)
- Cake naming: cake "Honey", cake "Pistachio Roll" format
- Voice: warm, concise, local. No overselling. Specifics over adjectives.
- Allergen disclosure included in responses
- Closes with soft CTA: "Order on the site at happycake.us or send a message on WhatsApp"
