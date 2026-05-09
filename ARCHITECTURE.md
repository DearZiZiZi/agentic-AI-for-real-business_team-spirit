# Happy Cake — Architecture

Minimal, demo-ready system for the Steppe Business Club hackathon. One agent, one Telegram bot, one Python service, one Next.js website. No database, no queue, no orchestrator. The hackathon brief is the spec; everything below directly serves the seven judging passes.

---

## 1. Constraints (from the brief)

- Agents run on Claude Code CLI with Opus 4.7. Invocation is `claude -p "<prompt>"`.
- Owner-facing UI is Telegram only.
- Customer channels: website (with on-site assistant), WhatsApp (sandbox), Instagram (sandbox).
- WhatsApp/Instagram webhooks tunnel via Cloudflare Tunnel.
- One MCP endpoint: `https://www.steppebusinessclub.com/api/mcp` with `X-Team-Token`.
- No Claude Agent SDK, no LangGraph, no CrewAI, no n8n, no other LLM provider.
- One agent → one Telegram bot. (Brief explicitly allows a single super-agent.)

---

## 2. Decision: one agent, one bot

We use **one agent** ("Concierge") with **one Telegram bot** (`@hc_owner_bot`). The brief allows it ("one super-agent that handles all four"). It's the smallest design that hits every outcome:

- Customer chat across web/WhatsApp/Instagram → same agent, different system prompt context per channel.
- Order taking, kitchen handoff, marketing run, owner Q&A → all via slash commands defined in `.claude/commands/`.
- Owner approvals & briefing → on the same `@hc_owner_bot`.

Splitting into multiple agents/bots is a 24-hour expense we can't afford. If we have time at the end, we add a second `@hc_inbox_bot` as a read-only transcript feed.

---

## 3. System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Customer channels                                                │
│   happycake.us       WhatsApp sandbox      Instagram sandbox    │
└────────┬───────────────────┬──────────────────────┬─────────────┘
         │ /api/chat         │ webhook              │ webhook
         │                   │ (via cloudflared)    │ (via cloudflared)
         ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ FastAPI service (single file: api/main.py, port 8080)           │
│   POST /api/chat                                                │
│   POST /webhooks/whatsapp                                       │
│   POST /webhooks/instagram                                      │
│   GET  /api/agents/catalog                                      │
│   GET  /api/agents/availability                                 │
│   POST /api/agents/order-intent                                 │
│   GET  /internal/audit?trace_id=...                             │
│                                                                 │
│   Per request: subprocess `claude -p "<prompt>"`                │
│   with the shared .claude/ project (MCP + system prompt).       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌────────────────────────┐         ┌────────────────────┐
              │ Claude Code CLI        │◀───────▶│ Hosted MCP sandbox │
              │ Opus 4.7               │         │ (catalog, kitchen, │
              │ Reads .claude/CLAUDE.md│         │ Square, marketing, │
              │ Uses .claude/mcp.json  │         │ WA/IG send, world) │
              └────────────┬───────────┘         └────────────────────┘
                           │
                           ▼ (on Tier-C events)
                    ┌──────────────┐
                    │ Telegram bot │
                    │ python-telegram-bot
                    │ owner_bot.py │
                    │ → @hc_owner_bot
                    └──────────────┘

State: ./logs/audit.jsonl (append-only) + ./data/state.json (latest snapshot).
No Postgres, no Redis. SQLite available via stdlib if we need indexed lookups.
```

---

## 4. The customer journey we ship

Pick one and make it bulletproof: **Instagram DM → on-site assistant → order intake → owner approval → kitchen ticket → confirmation**.


| #   | Step                                                                                                                                                           | What runs                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | Customer DMs Instagram                                                                                                                                         | Sandbox webhook → `/webhooks/instagram` |
| 2   | API validates, generates `trace_id`, runs `claude -p` with conversation context                                                                                | `api/claude_runner.py`                  |
| 3   | Claude calls `square_list_catalog`, `kitchen_get_production_summary`, replies in brand voice                                                                   | MCP                                     |
| 4   | Reply sent via `instagram_send_dm` MCP tool                                                                                                                    | MCP                                     |
| 5   | Customer says "I'll take it" → Claude detects ORDER_INTENT, drafts order via `square_create_order(status=pending)` and `kitchen_create_ticket(status=pending)` | MCP                                     |
| 6   | Tier classifier (Python, deterministic) decides: standard SKU = Tier B (auto-confirm in 5 min unless owner rejects); custom/complaint = Tier C (block)         | `api/tiers.py`                          |
| 7   | Owner gets a Telegram message with `[✅ Approve] [❌ Reject]` inline buttons                                                                                     | `bot/owner_bot.py`                      |
| 8   | On approve: `kitchen_accept_ticket`, `square_update_order_status(confirmed)`, confirmation DM to customer                                                      | MCP                                     |
| 9   | Every step writes to `./logs/audit.jsonl` with the same `trace_id`. `/internal/audit?trace_id=...` returns the timeline.                                       | `api/audit.py`                          |


Same flow handles WhatsApp (different webhook, different `*_send_message` tool) and the on-site widget (different POST endpoint, response returned synchronously instead of pushed back).

---

## 5. Trust tiers (the operator-friendly bit)

A 30-line deterministic Python function. No LLM call. Three outputs:


| Tier               | Trigger                                                                   | Behavior                                                                                |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **A** auto         | Reply contains only MCP-grounded facts; no order action                   | Sent immediately. Logged.                                                               |
| **B** auto + grace | Standard SKU order, AOV < `TIER_B_MAX_AOV_CENTS`, capacity confirmed      | Order drafted; Telegram message with 5-minute timer; auto-confirms unless owner rejects |
| **C** blocking     | Custom cake, allergen claim, refund/complaint, AOV ≥ threshold, off-hours | No customer reply until owner taps a button. Customer sees a holding message.           |


Why this matters: the Operator Simulator pass (15 pts) explicitly tests "can a non-technical operator run this?" Blanket approvals fail that test; trust tiers pass it.

---

## 6. Components

### 6.1 `api/main.py` (FastAPI, single file)

About 200 lines. All endpoints. Calls into `claude_runner.run(prompt)` which subprocesses `claude -p`. No async queue, no worker pool — request comes in, agent runs, response goes out. If a request takes 30 seconds, that's fine for a hackathon demo.

Key endpoints:

- `POST /api/chat` — on-site assistant: `{conversation_id, message}` → `{reply, suggested_actions}`
- `POST /webhooks/whatsapp` — sandbox WhatsApp; replies sent via `whatsapp_send_message` MCP tool inside the agent
- `POST /webhooks/instagram` — sandbox Instagram; replies via `instagram_send_dm`
- `GET /api/agents/catalog` — proxies `square_list_catalog`, returns plain JSON for AI customers
- `GET /api/agents/availability?date=YYYY-MM-DD` — proxies `kitchen_get_production_summary`
- `POST /api/agents/order-intent` — agent-friendly write endpoint for AI customers; same path as the chat-driven path internally
- `GET /internal/audit?trace_id=...` — gated by `INTERNAL_AUDIT_TOKEN`, returns timeline JSON

### 6.2 `api/claude_runner.py`

About 50 lines. One function:

```python
def run(prompt: str, *, trace_id: str, timeout_s: int = 60) -> AgentResult:
    """Subprocess `claude -p`. Capture JSON output. Log to audit.jsonl."""
```

Uses `claude -p PROMPT --output-format json --mcp-config .claude/mcp.json --cwd .`.

### 6.3 `api/tiers.py`

About 40 lines. Deterministic. Unit-tested.

### 6.4 `api/audit.py`

About 30 lines. Append-only JSONL writer keyed by `trace_id`. `read_trace(trace_id)` reads the file, filters, returns timeline.

### 6.5 `bot/owner_bot.py` (python-telegram-bot)

One process. Long-polling (no Telegram webhook needed → no extra tunnel route). About 250 lines.

Commands:

- `/today` — daily briefing (kitchen capacity today, pending Tier-C, yesterday's revenue)
- `/inbox` — list pending Tier-C items
- `/capacity` — kitchen capacity for today/tomorrow
- `/spend` — marketing run summary
- `/run_marketing` — kicks off the marketing cycle (calls `claude -p` with a slash command)
- `/escalate <text>` — manual flag

Inline button callbacks (`approve_ord_<id>`, `reject_ord_<id>`) call into the same `claude_runner.run(...)` with a slash-command prompt. No direct DB writes from the bot.

### 6.6 `web/` (Next.js, Vercel-ready)

Pages: `/`, `/cakes`, `/cakes/[slug]`, `/custom`, `/policies`, `/about`, `/lp/[campaign]`.

Catalog data: `web/data/catalog.json` (snapshot fetched at build time from `square_list_catalog`; rebuilt nightly in production).

On-site assistant: a small floating widget (vanilla React) bottom-right that POSTs to `/api/chat`. The website itself proxies through to the Python API via a Next.js rewrite (`/api/chat` → `http://localhost:8080/api/chat`).

Brand colors from the asset metadata: `#00AEEA` (sky blue), `#6B3A1E` (chocolate), `#FFF7EA` (vanilla cream), `#E94B7B` (berry).

### 6.7 Agent project (`.claude/`)

```
.claude/
├── CLAUDE.md           # short system prompt: brand voice, role rules, tool usage
├── mcp.json            # one MCP server: happycake (sandbox)
└── commands/
    ├── customer_reply.md      # /customer_reply  — main customer-message handler
    ├── order_decision.md      # /order_decision  — invoked by approve/reject buttons
    ├── run_marketing.md       # /run_marketing   — daily marketing cycle
    └── owner_briefing.md      # /owner_briefing  — for /today
```

`CLAUDE.md` is short (~40 lines): voice rules, "never invent facts," tool catalog, escalation triggers. The brand book is loaded as a reference file the agent can read on demand.

---

## 7. Data model

No database. Two on-disk artifacts:

- `./logs/audit.jsonl` — append-only event log. One line = one event with `trace_id`, `agent`, `event`, `payload`, `created_at`.
- `./data/state.json` — latest state snapshot: `{pending_orders: [...], conversations: {...}, last_marketing_run: {...}}`. Written under a file lock; rebuilt from `audit.jsonl` if lost.

If we hit a wall (e.g., concurrent writes), we drop in SQLite via `sqlite3` stdlib — one file, no service. We don't need it for the demo.

---

## 8. Agent-friendly website (cheap, high-leverage)

Three things, total ~4 hours of work, score the 15-point Agent-Friendliness pass:

1. **Read endpoints under `/api/agents/`**: `catalog`, `availability`, `policies`, `products/{slug}`, plus `POST /api/agents/order-intent`.
2. **Static discovery files**: `/agents.txt` at root explaining how to order; `/.well-known/ai-plugin.json` pointing at an OpenAPI doc; `robots.txt` allowing AI crawlers.
3. **JSON-LD on every product page**: `Product`, `Offer`, `MenuItem`, plus `LocalBusiness` on the home page.

The README ships with one copy-paste command:

```bash
claude -p "Order an 8-inch honey cake for Saturday 3 PM pickup. \
           Customer: Test Buyer. Use http://localhost:8080/api/agents."
```

If that works in front of the judge, the pass is locked.

---

## 9. Marketing loop

Triggered by `/run_marketing` on the Telegram bot or by a one-off cron. Single Claude run with the `/run_marketing` slash command. The prompt instructs the agent to:

1. Read `square_get_pos_summary` (last 7 days).
2. Allocate the remaining monthly budget across {Meta Ads, Google Ads, boosted IG, organic} by simple rule: weight previous-week ROAS, leave 20% for exploration.
3. For each slot, compose creative copy and pick an approved asset from `data/brand/assets-manifest.json`.
4. Call `marketing_create_campaign` and `marketing_launch_simulated_campaign`.
5. Call `marketing_generate_leads` and `marketing_report_to_owner`.
6. Reply with a one-screen summary that the bot posts to Telegram.

No multi-armed-bandit code in Python. Claude does the allocation reasoning, MCP does the side effects, evidence lands in the sandbox audit log.

---

## 10. Observability & evidence

The judges score evidence over claims. We give them three ways to verify:

- `./logs/audit.jsonl` — every event with `trace_id`. Grep-friendly.
- `GET /internal/audit?trace_id=<id>` — one HTTP call returns the human-readable timeline of one customer journey.
- `make demo-trace` — CLI that prints the most recent demo run as a timeline.

That's it. No structlog, no Sentry, no tracing service.

---

## 11. Failure handling (what we actually code)

- `claude -p` timeout (60s) → retry once with shorter context; if still failing, return a polite holding message and queue Tier-C escalation.
- MCP 5xx → `httpx` retry policy: 3 attempts, exponential backoff. After that, escalate.
- Webhook validation fails → 401 + audit_log entry, no further work.
- Bot offline → Telegram delivers updates via long-polling on next start; no message lost.
- File-lock contention on `state.json` → wait 200ms and retry. Acceptable at demo scale.

What we don't build: dead-letter queues, circuit breakers, exponential health checks, structured retries with jitter. Demo doesn't need them.

---

## 12. Security (minimum viable)

- Every secret via env. `.env.example` ships placeholders only.
- `.env` and `logs/` in `.gitignore` from the first commit.
- `INTERNAL_AUDIT_TOKEN` gates `/internal/audit`.
- HMAC validation on webhooks: implemented, secret pulled from env. If sandbox doesn't sign, we accept all and log a warning.
- Telegram bot checks `TELEGRAM_OWNER_USER_ID` before running owner commands.

We skip: pre-commit hooks, gitleaks, PII redaction in logs (we just don't log message bodies in production), CSP/CORS hardening beyond defaults, audit-log immutability at the DB level.

---

## 13. Repo layout

```
happycake/
├── README.md
├── ARCHITECTURE.md
├── BUSINESS_IMPACT.md
├── PRODUCTION_HANDOFF.md
├── IMPLEMENTATION_PLAN.md
├── .env.example
├── .gitignore
├── Makefile
├── requirements.txt
│
├── .claude/
│   ├── CLAUDE.md
│   ├── mcp.json
│   └── commands/
│       ├── customer_reply.md
│       ├── order_decision.md
│       ├── run_marketing.md
│       └── owner_briefing.md
│
├── api/
│   ├── main.py              # FastAPI, all endpoints
│   ├── claude_runner.py     # subprocess wrapper
│   ├── mcp_proxy.py         # thin httpx wrapper used by /api/agents/*
│   ├── tiers.py             # deterministic trust tiers
│   ├── audit.py             # JSONL writer/reader
│   └── prompts.py           # prompt builders per channel
│
├── bot/
│   └── owner_bot.py         # python-telegram-bot, long-polling
│
├── web/                     # Next.js
│   ├── app/
│   ├── components/
│   ├── data/catalog.json
│   ├── public/agents.txt
│   ├── public/.well-known/ai-plugin.json
│   └── public/brand/        # logo, hero, products, social images
│
├── data/
│   ├── brand.md             # voice, claims, refusal templates
│   ├── policies.md
│   ├── catalog_seed.json    # fallback catalog if MCP is down
│   └── assets-manifest.json # mirror of asset pack metadata
│
├── prompts/
│   └── system.md            # the long-form system prompt the agent reads
│
├── scripts/
│   ├── start.sh             # starts api + bot + web + tunnel
│   ├── stop.sh
│   ├── register_webhooks.sh
│   ├── demo.sh              # scripted end-to-end run
│   └── demo_trace.py        # prints the latest trace
│
└── logs/                    # gitignored
    └── audit.jsonl
```

---

## 14. Local setup (demo)

```bash
git clone https://github.com/<team>/happycake
cd happycake
make setup                         # python venv + node deps + cloudflared check
cp .env.example .env
# fill: TEAM_TOKEN, TELEGRAM_OWNER_BOT_TOKEN, TELEGRAM_OWNER_USER_ID, INTERNAL_AUDIT_TOKEN
make start                         # api + bot + web + tunnel; prints public URL
make register-webhooks             # registers tunnel URL with sandbox simulator
make demo                          # scripted journey; prints trace_id at end
make demo-trace                    # human-readable timeline of last demo
```

Five env values, five commands, full demo.

---

## 15. Production handoff (later)

In `PRODUCTION_HANDOFF.md`. Eight changes, all named with file:line refs:

1. MCP base URL → real WhatsApp Cloud API + Meta Graph + Square live
2. ngrok/cloudflared dev URL → permanent Cloudflare Tunnel hostname
3. Vercel deploy for `web/`
4. Postgres for state (we ship working SQLite swap)
5. Real Telegram bot tokens + Askhat's user id
6. SMS fallback (Twilio) for Tier-C escalation timeouts
7. Backups + rotation
8. Real review-funnel + Google Business write access

We don't write the production code; we name the swaps.

---

## 16. What we cut (and why)


| Removed                                                                   | Reason                                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 4 separate agents + 4 bots                                                | One agent ships in 1/4 the time, brief allows it                        |
| Postgres + Redis + arq workers                                            | JSONL + state.json is enough for a demo; SQLite is the fallback         |
| Custom router service                                                     | Slash commands in `.claude/commands/` are the router                    |
| Multi-armed bandit Python code                                            | Claude does the allocation reasoning in-prompt                          |
| structlog + Sentry + Prometheus                                           | JSONL audit + one HTTP endpoint is the evidence layer                   |
| Pre-commit hooks + gitleaks + PII redactor                                | `.gitignore` + env discipline + don't-log-bodies covers it              |
| shadcn/ui + Tailwind component library                                    | Plain Next.js + Tailwind utilities; the brand pack is the design system |
| OpenAPI + ai-plugin.json + agents.txt as three separate engineering tasks | One file, one OpenAPI doc, one `agents.txt`. ~3 hours total.            |
| pyproject.toml monorepo + workspaces                                      | One `requirements.txt`, one `package.json`. Flat.                       |


---

## 17. How this maps to the seven judging passes


| Pass                        | Weight | What earns the points here                                                                                                       |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Functional tester           | 20     | One canonical journey hardened; idempotent webhooks; retries; replies via MCP send tools. Public + secret scenarios both stable. |
| Agent-friendliness auditor  | 15     | `/api/agents/*`, `/agents.txt`, `/.well-known/ai-plugin.json`, JSON-LD, README ships a working `claude -p` order command.        |
| On-site assistant evaluator | 15     | Same agent + same prompt + MCP-only facts + Tier-C escalation. Five-scenario test script in README.                              |
| Code reviewer               | 10     | One `requirements.txt`, exhaustive `.env.example`, `make start` works on a fresh clone, `PRODUCTION_HANDOFF.md` named swaps.     |
| Operator simulator          | 15     | Trust tiers + 5-min grace + `/today` daily briefing + humane commands. Owner is not a button factory.                            |
| Business analyst            | 15     | `BUSINESS_IMPACT.md` derives AOV, repeat rate, cohort retention from the sales CSV; explicit $500 → $5,000 math, not vibes.      |
| Innovation/depth            | 10     | Multilingual (EN/ES/UR/HI/VI for Sugar Land demographics), agent-friendly protocol, voice-note WA ingest if time.                |


