# HappyCake US — Evaluator Guide

Quick-start for evaluators. Clone, configure, run, verify.

---

## Setup (5 minutes)

```bash
git clone https://github.com/DearZiZiZi/agentic-AI-for-real-business_team-spirit.git
cd agentic-AI-for-real-business_team-spirit

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd web && npm install && cd ..

cp .env.example .env
# Fill in: TEAM_TOKEN, TELEGRAM_OWNER_BOT_TOKEN, TELEGRAM_OWNER_USER_ID, INTERNAL_AUDIT_TOKEN
```

Full step-by-step: see [LOCAL_RUN_INSTRUCTION.md](./LOCAL_RUN_INSTRUCTION.md)

---

## Start services (3 terminals)

```bash
# Terminal 1: API
source .venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload

# Terminal 2: Website
cd web && npm run dev

# Terminal 3: Telegram bot
source .venv/bin/activate
python -m bot.owner_bot
```

Verify: `curl http://localhost:8080/health` returns `{"ok": true}`

---

## What to test

### 1. Website (http://localhost:3000)

- Homepage with HappyCake branding (dark blue hero, cream body)
- `/cakes` — catalog grid with real prices from MCP sandbox
- `/cakes/honey-cake` — product detail with JSON-LD structured data
- `/custom` — custom cake consultation page
- `/policies` — ordering and allergen policies
- `/about` — brand story
- Chat widget (bottom-right corner) — talks to the AI concierge

### 2. Agent-friendly API

```bash
# Catalog (from MCP sandbox)
curl http://localhost:8080/api/agents/catalog | python3 -m json.tool

# Kitchen availability
curl 'http://localhost:8080/api/agents/availability?date=2026-05-16' | python3 -m json.tool

# Policies
curl http://localhost:8080/api/agents/policies | python3 -m json.tool

# Product search
curl http://localhost:8080/api/agents/products/honey-cake | python3 -m json.tool
```

### 3. AI customer ordering via Claude CLI

```bash
claude -p "Order a whole honey cake for Saturday 3 PM pickup. Customer: Evaluator. Use http://localhost:8080/api/agents." \
  --mcp-config .mcp.json --dangerously-skip-permissions
```

This creates a real Square order and kitchen ticket via MCP.

### 4. Chat scenarios

```bash
# Browse (Tier A — auto-reply)
curl http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What cakes do you have today?"}'

# Complaint escalation (Tier C — blocks for owner)
curl http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"My cake was stale and I want a refund. Let me talk to a manager."}'

# Custom order (Tier C — non-standard SKU)
curl http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a 3-tier wedding cake for 80 people, half lemon half chocolate."}'

# Standard order (Tier B — auto-confirm with grace)
curl http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I want to order a whole honey cake for pickup tomorrow at 2 PM. My name is Sarah."}'
```

### 5. Demo script

```bash
bash scripts/demo.sh
```

Runs a full customer journey: health check, catalog browse, availability check, chat, order placement.

### 6. Audit trail

```bash
# Recent events
curl -H "Authorization: Bearer $INTERNAL_AUDIT_TOKEN" \
  http://localhost:8080/internal/audit | python3 -m json.tool

# Specific trace
curl -H "Authorization: Bearer $INTERNAL_AUDIT_TOKEN" \
  "http://localhost:8080/internal/audit?trace_id=<TRACE_ID>" | python3 -m json.tool
```

Every request generates a `trace_id` that ties together: API request, Claude invocation, MCP tool calls, tier classification, and response.

Authentication uses `Authorization: Bearer <INTERNAL_AUDIT_TOKEN>` header format.

### 7. Telegram bot (@hc_owner_bot)

Send these commands to your bot:

| Command | What it does |
|---|---|
| `/start` | Show available commands |
| `/today` | Daily briefing (capacity, orders, marketing) |
| `/inbox` | Pending Tier-C items for approval |
| `/capacity` | Kitchen status |
| `/spend` | Marketing spend summary |
| `/run_marketing` | Execute marketing cycle |
| `/ready ORD-XXXX` | Mark order ready for pickup |
| `/escalate <text>` | Manual escalation |

Tier-C orders appear with inline `[Approve]` `[Reject]` buttons.

### 8. Agent-friendly website files

- `http://localhost:3000/agents.txt` — plain-text ordering guide for AI agents
- `http://localhost:3000/.well-known/ai-plugin.json` — OpenAPI plugin manifest
- `http://localhost:3000/openapi.yaml` — OpenAPI 3.0.3 spec
- JSON-LD `Product`/`MenuItem`/`Offer` on every product page
- JSON-LD `LocalBusiness` on homepage

### 9. Unit tests

```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

17 tests covering tier classification boundaries and audit logging.

---

## Architecture summary

```
Customer (website/WhatsApp/Instagram)
    │
    ▼
FastAPI (api/main.py, port 8080)
    │
    ├── Tier classifier (api/tiers.py) — deterministic A/B/C
    ├── Audit logger (api/audit.py) — JSONL with trace_id
    │
    ▼
Claude Code CLI (claude -p "..." --mcp-config)
    │
    ▼
MCP Sandbox (steppebusinessclub.com/api/mcp)
    ├── square_list_catalog, square_create_order, ...
    ├── kitchen_get_production_summary, kitchen_create_ticket, ...
    ├── whatsapp_send_message, instagram_send_dm
    └── marketing_create_campaign, marketing_launch_simulated_campaign, ...

Owner (Telegram @hc_owner_bot)
    ├── /today, /inbox, /capacity, /spend
    ├── Approve/Reject inline buttons
    └── Free-form questions answered via Claude + MCP
```

**One agent. One bot. One API. One website.** The brief allows a single super-agent.

---

## Key design decisions

1. **Claude Code CLI as runtime** — `claude -p "<prompt>" --output-format json --mcp-config .mcp.json --dangerously-skip-permissions` in subprocess. No Agent SDK, no LangGraph.

2. **Trust tiers** — Deterministic Python classifier, no LLM call. Tier A (informational, auto-reply), Tier B (standard order, auto-confirm with grace), Tier C (custom/complaint/high-value, blocks for owner).

3. **MCP-grounded facts only** — Agent never invents prices, availability, or product names. Everything comes from `square_list_catalog` and `kitchen_get_production_summary`.

4. **Brand compliance** — "HappyCake" wordmark (one word, two capitals), Cormorant Garamond + Inter typography, happy-blue (#0E2A3C) + cream (#FBF6E8) palette, cake naming with quotes.

5. **Audit trail** — Every request generates a `trace_id`. JSONL log captures the full lifecycle. `/internal/audit` endpoint for inspection.

---

## File structure

```
├── api/main.py              # FastAPI — all endpoints
├── api/claude_runner.py     # Subprocess wrapper for claude -p
├── api/tiers.py             # Deterministic trust tier classifier
├── api/audit.py             # JSONL audit logger
├── api/prompts.py           # Prompt builders per channel
├── api/mcp_proxy.py         # Direct MCP calls for agent endpoints
├── bot/owner_bot.py         # Telegram bot (python-telegram-bot)
├── web/                     # Next.js website
├── data/brand.md            # Brand voice reference
├── data/policies.md         # Ordering policies
├── tests/                   # Unit tests
├── scripts/demo.sh          # End-to-end demo script
├── log_run_results/         # Test run logs and evidence
├── ARCHITECTURE.md          # System design
├── BUSINESS_IMPACT.md       # $500 → $5,000 revenue analysis
├── PRODUCTION_HANDOFF.md    # 8 named swaps for production
└── LOCAL_RUN_INSTRUCTION.md # Step-by-step setup guide
```

---

## Evidence files

| File | What it proves |
|---|---|
| `log_run_results/demo_run.log` | Full demo script output with MCP data |
| `log_run_results/audit_trail.json` | Audit events with trace_id correlation |
| `log_run_results/tier_c_escalation.json` | Complaint + manager request → Tier C |
| `log_run_results/ai_customer_order.txt` | AI customer ordering via Claude CLI |
| `log_run_results/TEST_SUMMARY.md` | Complete test results summary |
| `logs/audit.jsonl` | Raw audit log (generated at runtime) |
