# Happy Cake US — System Architecture

> Production-ready, end-to-end agentic sales & operations system for Happy Cake US, built on the Steppe Business Club hackathon runtime (Claude Code CLI + Telegram + ngrok + hosted MCP sandbox).

---

## 0. North star

One sentence: **Every customer message on any channel becomes a logged, MCP-grounded, brand-consistent reply within 10 seconds; every order intent becomes a kitchen-capacity-checked, owner-approved POS order with a clean handoff and a paper trail the evaluator can read.**

We optimize for four things, in priority order:

1. **Reliability** — message lost = trust lost. Idempotent webhooks, queue-backed processing, retries, dead-letter, audit log.
2. **Groundedness** — every customer-facing fact is backed by a sandbox MCP call in the same turn. The agent literally cannot promise what the kitchen can't deliver.
3. **Operator sanity** — Askhat does not approve every sentence. Trust tiers route 80%+ of replies through auto-paths and only block him on real decisions.
4. **Production handoff** — every sandbox seam is named so a single document (`PRODUCTION_HANDOFF.md`) lists exactly which files to swap to ship to a real customer.

---

## 1. Hard constraints (recap from brief)

| Rule | Implication |
|---|---|
| Agents must run on Claude Code CLI with Opus 4.7 | All agent invocations are `claude -p "<prompt>"` subprocesses |
| One agent → one Telegram bot | We have 4 agents → 4 bots |
| Owner UI is Telegram only | No web admin panel; observability is read-only files plus `/internal/audit` evidence page (gated, for evaluator) |
| Webhooks tunnel via ngrok / Cloudflare Tunnel | One persistent tunnel; webhook URLs registered with the simulator |
| Hosted MCP at `https://www.steppebusinessclub.com/api/mcp` with `X-Team-Token` | All real-world side effects flow through this single endpoint |
| No Claude Agent SDK / LangGraph / CrewAI / n8n / other LLMs | Agents are plain prompts + MCP config; orchestration is plain Python |
| No real credentials | Sandbox is the source of truth for the hackathon |

---

## 2. System diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ CUSTOMER CHANNELS                                                        │
│   ┌───────────────────┐   ┌─────────────────┐   ┌──────────────────┐    │
│   │ happycake.us      │   │ WhatsApp        │   │ Instagram        │    │
│   │ (Next.js, Vercel) │   │ (sandbox)       │   │ (sandbox)        │    │
│   └────────┬──────────┘   └────────┬────────┘   └─────────┬────────┘    │
│            │ /api/chat             │ webhook              │ webhook     │
│            │ /api/order-intent     │ via Cloudflare       │ via CF      │
│            │ /api/agents/*         │ Tunnel               │ Tunnel      │
└────────────┼───────────────────────┼──────────────────────┼─────────────┘
             │                       │                      │
             ▼                       ▼                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ INGRESS — FastAPI app on operator's machine, bound to localhost:8080     │
│  • HMAC validation on every webhook                                      │
│  • Idempotency table (Redis, TTL 24h, key = X-Event-Id)                  │
│  • Returns 200 in <100ms; enqueues ConversationEvent                     │
│  • Per-channel + per-handle rate limiting                                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ enqueue
                                     ▼
                        ┌────────────────────────┐
                        │  Redis Queue (arq)     │
                        │  events.in / events.dlq│
                        └────────────┬───────────┘
                                     │ worker pool
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ROUTER — classifies event → picks agent → builds prompt → invokes        │
│  Hybrid: regex/keyword fast path → fallback `claude -p` short call       │
│  Output: agent_name, prompt_context, trust_tier_hint                     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
        ┌──────────────┬─────────────┼──────────────┬──────────────┐
        ▼              ▼             ▼              ▼              ▼
 ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐
 │ Concierge    │ │ Orders       │ │ Marketing  │ │ Operator    │
 │ Agent        │ │ Agent        │ │ Agent      │ │ Agent       │
 │              │ │              │ │            │ │             │
 │ claude -p    │ │ claude -p    │ │ claude -p  │ │ claude -p   │
 │ + MCP        │ │ + MCP        │ │ + MCP      │ │ + MCP       │
 │ + brand      │ │ + kitchen    │ │ + sales    │ │ + audit log │
 │ + catalog    │ │ + Square     │ │   CSV      │ │ + state     │
 │              │ │ + trust tier │ │            │ │             │
 │ → @hc_       │ │ → @hc_       │ │ → @hc_     │ │ → @hc_      │
 │   concierge_ │ │   orders_    │ │   mktg_    │ │   owner_    │
 │   bot        │ │   bot        │ │   bot      │ │   bot       │
 └──────┬───────┘ └──────┬───────┘ └──────┬─────┘ └──────┬──────┘
        │                │                │              │
        └────────────────┴────────────────┴──────────────┘
                                  │
                                  ▼
                     ┌────────────────────────────┐
                     │ MCP CLIENT (shared)        │
                     │ steppebusinessclub.com/    │
                     │   api/mcp                  │
                     │ X-Team-Token (env only)    │
                     │                            │
                     │ tools (per brief):         │
                     │  • catalog / square_*      │
                     │  • kitchen_*               │
                     │  • marketing_*             │
                     │  • world_*                 │
                     │  • evaluator_*             │
                     │  • whatsapp_* / ig_*       │
                     │  • google_business_*       │
                     └────────────┬───────────────┘
                                  │
                                  ▼
                     ┌────────────────────────────┐
                     │ STATE & EVIDENCE LAYER     │
                     │  Postgres (durable)        │
                     │   conversations, messages, │
                     │   customers, lead_intents, │
                     │   orders, audit_log        │
                     │  Redis (queue + locks)     │
                     │  jsonl audit (./logs/)     │
                     └────────────────────────────┘
```

---

## 3. Agent decomposition (and why)

We use a **router + four role agents**. Not one super-agent, not seven micro-agents.

| Agent | Purpose | Telegram bot | Triggers |
|---|---|---|---|
| **Concierge** | Customer-facing chat across web, WhatsApp, Instagram. Answers questions, configures cakes, captures order intent, escalates safely. | `@hc_concierge_bot` (transcript-only feed; owner observes) | Inbound message webhook from any customer channel |
| **Orders** | Verifies capacity, prices items, drafts kitchen tickets and Square orders, applies trust tiers, gathers owner approval, confirms back to customer. | `@hc_orders_bot` (action bot — approve/reject/edit) | Concierge raises an `ORDER_INTENT` event |
| **Marketing** | Daily/weekly campaign loop: reads sales summary, allocates the $500/mo across channels via simulated multi-armed bandit, runs simulator campaigns, reports ROAS. | `@hc_marketing_bot` (control bot — approve creatives, adjust spend) | Cron + owner commands |
| **Operator** | Owner's universal "ask-anything" bot. Daily 8 AM briefing, ad-hoc queries (`/today`, `/capacity`, `/spend`, `/inbox`, `/escalate`), anomaly alerts. | `@hc_owner_bot` (the bot Askhat actually opens every morning) | Cron + owner commands + system anomalies |

### Why this decomposition

- **Tight system prompts.** Each agent has a short, role-specific `CLAUDE.md` and a bounded MCP tool surface. Claude is dramatically better with focused tool sets than with the full kitchen sink.
- **Different invocation patterns.** Concierge is event-driven (every webhook). Marketing is cron-driven (daily). Operator is a hybrid (cron + owner commands). Different lifetimes, different prompts.
- **Bot per agent satisfies the rule.** Each agent has exactly one bot — not a routing trick, not a multi-purpose bot.
- **Maps cleanly to judging rubric.** The seven AI passes evaluate channels, on-site assistant, marketing loop, operator UX separately. Each role agent owns one or two of those rubric items.

### What we explicitly do **not** do

- **No agent-to-agent prompts as RPC.** Agents communicate via the queue and database, not by reading each other's prompts. Prevents prompt-injection chains and makes traces clean.
- **No long-running agent processes.** Every `claude -p` invocation is a fresh subprocess with the relevant context loaded. State lives in Postgres.

---

## 4. The canonical customer journey

This is the vertical slice that must work end-to-end on demo day. Other journeys (WhatsApp inquiry, complaint, status check) are variations on this spine.

**Scenario:** Sarah sees a honey cake on Instagram, DMs Happy Cake, places an order for Saturday pickup, gets confirmation, picks up, leaves a review.

| Step | Actor | What happens | Evidence trail |
|---|---|---|---|
| 1 | Sarah | Sees IG post, taps "Send Message", DMs "Do you have honey cake for Saturday?" | IG sandbox event |
| 2 | Sandbox | Fires webhook to operator's CF Tunnel URL | Sandbox `mcp_audit_log` |
| 3 | Ingress | Validates HMAC, dedupes via `X-Event-Id`, returns 200, enqueues | `audit_log` row: `event=webhook.received` |
| 4 | Router | Classifies: channel=instagram, intent=inquiry, customer=ig_handle:sarah_h | `audit_log` row: `event=routed.concierge` |
| 5 | Concierge | Wrapper builds prompt with: brand voice, last 5 messages, customer CRM lookup (returns "first-time customer"), runs `claude -p` | `audit_log` row: `event=agent.invoked` |
| 6 | Claude | Calls `square_list_catalog(query="honey cake")`, then `kitchen_get_production_summary(date="Saturday")`, composes reply | MCP audit log + local `audit_log` row with tool calls |
| 7 | Concierge | Sends IG DM via `instagram_send_dm` MCP; transcript posted (silent) to `@hc_concierge_bot` | Outbound message in DB; Telegram message |
| 8 | Sarah | Replies "I'll take it, 8-inch round, with 'Happy Birthday Asel' on top, pickup Saturday 3 PM" | Inbound webhook |
| 9 | Concierge | Detects `ORDER_INTENT`, persists `lead_intents` row, enqueues for Orders agent, replies to Sarah with a placeholder ("Got it — confirming with the kitchen, one moment") | `audit_log`: `event=order_intent.captured` |
| 10 | Orders | Calls `kitchen_get_production_summary` (capacity), calls `square_list_catalog` (price the item), classifies trust tier (custom text → **Tier B**: standard SKU + custom inscription, AOV under threshold) | `audit_log`: `event=tier.B` |
| 11 | Orders | Drafts `square_create_order(status=pending)` and `kitchen_create_ticket(status=pending)`; posts to `@hc_orders_bot` with inline keyboard `[✅ Approve] [✏️ Edit] [❌ Reject]` and a 5-minute auto-confirm timer | DB: `orders` row, status=pending; Telegram message id stored |
| 12 | Askhat | Taps Approve | Telegram callback |
| 13 | Orders | Calls `kitchen_accept_ticket`, `square_update_order_status(status=confirmed)`, persists confirmation, instructs Concierge to send confirmation DM | `audit_log`: `event=order.confirmed` |
| 14 | Concierge | Sends final IG DM with order ID, pickup time, total, allergen note, T&C link to website | DB outbound message |
| 15 | Kitchen sim | Acknowledges ticket, returns expected_ready_at | Sandbox `mcp_audit_log` |
| 16 | Saturday morning | Owner Daily Briefing lists Sarah's pickup at 3 PM | Telegram message |
| 17 | Saturday 2:50 PM | Owner taps `/ready ORD-1042` in `@hc_orders_bot` | Triggers `square_update_order_status(status=ready)`, IG DM to Sarah |
| 18 | Sunday 4 PM | Cron fires review request via IG DM with link to Google Business | DB row, scheduled job |
| 19 | Sarah | Leaves 5-star review on simulated Google Business | `world_next_event` |
| 20 | Operator agent | Posts thank-you Telegram with review summary; flags review for owner reply suggestion | `audit_log` |

**Invariant:** every step writes one or more rows to `audit_log` with `trace_id` linking the entire customer journey. The evaluator can grep one trace_id and see the whole story.

---

## 5. Trust-tier approval model

The default Telegram-bot approach is "owner approves every reply." That collapses under load. We use three tiers, decided per outbound action by a deterministic policy:

| Tier | Rule | Examples | UX |
|---|---|---|---|
| **A — Auto** | Reply contains only facts grounded in MCP this turn (catalog, hours, address, current capacity) AND is not order-creating | "Hours are 9–7", "Yes we have honey cake today", "Pickup is at 1234 Main" | Sent immediately. Logged silently to `@hc_concierge_bot` for transparency. |
| **B — Auto with grace window** | Standard SKU order, AOV under $X (configurable, default $80), no allergen claims, kitchen capacity confirmed | 8-inch honey cake with custom text, standard cupcake dozen | Order drafted as `pending`. Posted to `@hc_orders_bot` with 5-minute timer. Owner can override; otherwise auto-confirms. Customer sees a placeholder reply, then a confirmation. |
| **C — Blocking** | Custom multi-tier cake, allergen claim ("our peanut-free chocolate"), refunds, complaints, order over $X, off-hours requests, vague product references | "I want a 3-tier wedding cake", "Refund my last order", "Are you halal-certified?" | No customer reply until owner responds. Holding message after 30 min ("we'll get back to you within the hour"). |

The tier classifier lives in `packages/trust_tiers/` as a pure Python function with unit tests. It is never an LLM call — must be deterministic, debuggable, and overrideable from Telegram (`/tier set CUSTOMER B`).

---

## 6. Component catalog

### 6.1 Ingress (`apps/ingress/`)

- **Tech:** FastAPI + uvicorn, Pydantic models for every webhook
- **Endpoints:**
  - `POST /webhooks/whatsapp` — sandbox WhatsApp inbound
  - `POST /webhooks/instagram` — sandbox Instagram inbound (DM, comment, story reply)
  - `POST /webhooks/telegram/{bot_id}` — Telegram update (one route per bot)
  - `POST /api/chat` — on-site assistant (called from Next.js widget)
  - `POST /api/order-intent` — agent-friendly direct order (called by AI customers)
  - `GET  /api/agents/catalog` — agent-friendly catalog dump
  - `GET  /api/agents/availability?date=YYYY-MM-DD&size=8in` — capacity probe
  - `GET  /api/agents/policies` — policy doc as JSON
  - `GET  /health`, `GET  /metrics`
  - `GET  /internal/audit?trace_id=...` — gated, evaluator-only evidence page (token in env)
- **Behavior:** validate HMAC against per-channel secret; reject duplicate `X-Event-Id` within 24h; return 200 in under 100ms; enqueue to Redis.

### 6.2 Queue & Worker (`apps/workers/`)

- **Tech:** [arq](https://arq-docs.helpmanual.io/) (async Redis queue) — chosen because the wrappers are async and arq is single-binary simple
- **Queues:** `events.in`, `events.scheduled`, `events.dlq`
- **Concurrency:** 4 workers default (one per agent role, soft separation)
- **Retries:** exponential backoff 1s → 4s → 16s → 60s, then DLQ
- **Job shape:** `{trace_id, channel, customer_external_id, payload, attempt, agent_hint?}`

### 6.3 Router (`apps/router/`)

- Pure Python, no LLM. Reads job, looks up customer, picks agent.
- Decision table (excerpt):
  - `channel ∈ {whatsapp, instagram, web}` AND no active order intent → **Concierge**
  - Concierge raised `ORDER_INTENT` → **Orders**
  - Cron `marketing.daily` → **Marketing**
  - Telegram update on owner bot → **Operator**
  - Telegram update on orders bot (callback button) → **Orders** (continuation)
- Falls back to a 1-shot `claude -p` classifier only if regex confidence < 0.7. Logged.

### 6.4 Agents (`agents/<role>/`)

Each role agent is a Claude Code project directory:

```
agents/concierge/
├── .claude/
│   ├── CLAUDE.md         # system prompt: brand voice, role rules, tool catalog
│   ├── mcp.json          # MCP server config (env-substituted token)
│   └── commands/
│       ├── reply.md      # slash command: /reply <conversation_id>
│       └── escalate.md   # /escalate <reason>
└── README.md
```

Invocation contract (`packages/claude_runner/`):

```python
def run_agent(agent: str, prompt: str, *, mcp_config: Path,
              max_turns: int = 8, timeout_s: int = 60) -> AgentResult:
    """
    Subprocess wrapper around `claude -p`. Returns parsed JSON output:
    { reply: str, tool_calls: list[ToolCall], cost_usd: float, ... }
    """
```

The wrapper:
- Uses `claude -p PROMPT --output-format json --mcp-config PATH --cwd AGENT_DIR`
- Captures stdout/stderr; persists to `./logs/agents/<trace_id>.jsonl`
- Returns parsed result; raises typed errors on timeout / nonzero exit

### 6.5 MCP Client (`packages/mcp_client/`)

- Typed wrappers around every MCP tool we use, with retry policies and structured logging
- Single source for `X-Team-Token` injection (read from env only — never hardcoded)
- Used both by the agents (via Claude's MCP config) and by orchestration code that needs direct calls (e.g., the cron marketer reads `square_get_pos_summary` directly to build the prompt before invoking Claude)

### 6.6 CRM (`packages/crm/`)

- Seeded from the anonymized 6-month sales CSV at first boot
- Tables (Postgres): `customers`, `customer_orders`
- Lookups: `find_by_phone`, `find_by_ig_handle`, `recent_orders`, `lifetime_value`, `last_seen`
- Agents inject CRM context into prompts: *"Customer Sarah, last order June 2025 (strawberry shortcake $58), 2nd-time customer."*

### 6.7 Trust Tiers (`packages/trust_tiers/`)

- Pure deterministic policy
- Inputs: outbound action, draft order, customer history, capacity, brandbook claims set
- Output: `Tier.A | Tier.B | Tier.C` plus `reason: str`
- Unit tested with 50+ fixture cases (the brief's evaluator will probe edges)

### 6.8 Telegram bots (`apps/bots/`)

- **Tech:** [aiogram 3](https://docs.aiogram.dev/) (Python, async, batteries-included)
- One process per bot; all bots share the same Postgres connection and the Redis queue
- Owner commands (on `@hc_owner_bot`):
  - `/today` → daily briefing on demand
  - `/inbox` → pending Tier-C items
  - `/capacity` → today/tomorrow kitchen capacity
  - `/spend` → marketing spend so far + ROAS
  - `/escalate <text>` → manually flag a conversation for the owner
  - `/pause <channel>` → put a channel in human-only mode for N minutes
  - `/tier set <customer_id> <A|B|C>` → override default tier for a customer
- Inline keyboard callbacks routed back to the owning agent via the queue (so all decisions go through the same audit pipeline)

### 6.9 Website (`apps/web/`)

- **Tech:** Next.js 14 App Router, Tailwind, shadcn/ui, deployed to Vercel
- **Pages:** `/` (hero + featured), `/cakes` (catalog), `/cakes/[slug]` (product), `/custom` (custom-cake intake), `/policies`, `/locations`, `/faq`, `/about`, `/lp/[campaign]` (campaign landing pages with attribution)
- **On-site assistant:** floating widget bottom-right, opens drawer; client posts to `/api/chat`; same Concierge agent backs it
- **Agent-friendly surfaces** (see §9)
- **Brand:** Happy Sky Blue `#00AEEA`, Chocolate Brown `#6B3A1E`, Vanilla Cream `#FFF7EA`, Berry Accent `#E94B7B` (per the asset metadata)

### 6.10 Observability (`packages/observability/`)

- structlog with JSON renderer; every log line carries `trace_id`, `agent`, `channel`, `customer_id`
- Filesystem audit log at `./logs/audit.jsonl` (append-only, rotated daily)
- `audit_log` table in Postgres (queryable, indexed on `trace_id`, `agent`, `created_at`)
- Optional: Sentry SDK enabled when `SENTRY_DSN` is set

### 6.11 Security (`packages/security/`)

- HMAC validation per channel (`WHATSAPP_WEBHOOK_SECRET`, `INSTAGRAM_WEBHOOK_SECRET`, `TELEGRAM_WEBHOOK_SECRET`)
- All secrets via env; `.env.example` is exhaustive; pre-commit hook blocks `sbc_team_*` / `sk_live_*` patterns
- PII redaction in logs: phone → SHA-256 last 8; IG handle preserved (not PII per Meta TOS); message bodies redacted under `LOG_REDACT_BODIES=true` flag
- Rate limit: 30 events/min per `(channel, customer_external_id)`; 1000/min global

---

## 7. Data model (Postgres)

```sql
-- Conversations span channels but unify on customer_id when known
CREATE TABLE conversations (
  id              BIGSERIAL PRIMARY KEY,
  channel         TEXT NOT NULL,           -- 'whatsapp' | 'instagram' | 'web' | 'telegram'
  external_thread TEXT NOT NULL,           -- IG thread id, WA phone, web session id
  customer_id     BIGINT REFERENCES customers(id),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  last_event_at   TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'open',
  UNIQUE (channel, external_thread)
);

CREATE TABLE messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(id),
  trace_id        UUID NOT NULL,
  direction       TEXT NOT NULL,           -- 'in' | 'out'
  agent           TEXT,                    -- which agent produced an 'out' message
  content         TEXT,
  tool_calls      JSONB,
  trust_tier      TEXT,                    -- 'A' | 'B' | 'C'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON messages (conversation_id, created_at);
CREATE INDEX ON messages (trace_id);

CREATE TABLE customers (
  id              BIGSERIAL PRIMARY KEY,
  phone_e164      TEXT UNIQUE,             -- whatsapp / sms
  ig_handle       TEXT UNIQUE,
  email           TEXT UNIQUE,
  name            TEXT,
  preferred_lang  TEXT DEFAULT 'en',
  first_seen      TIMESTAMPTZ DEFAULT NOW(),
  last_order_at   TIMESTAMPTZ,
  ltv_cents       INT DEFAULT 0,
  tags            JSONB DEFAULT '[]'       -- ['repeat', 'corporate', 'allergy:nuts', ...]
);

CREATE TABLE lead_intents (
  id              BIGSERIAL PRIMARY KEY,
  trace_id        UUID NOT NULL,
  customer_id     BIGINT REFERENCES customers(id),
  conversation_id BIGINT REFERENCES conversations(id),
  payload         JSONB NOT NULL,          -- parsed intent: items, date, custom text, allergens
  status          TEXT NOT NULL DEFAULT 'new',  -- new | priced | confirmed | rejected | abandoned
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id                  BIGSERIAL PRIMARY KEY,
  trace_id            UUID NOT NULL,
  customer_id         BIGINT REFERENCES customers(id),
  square_order_id     TEXT,
  kitchen_ticket_id   TEXT,
  items               JSONB NOT NULL,
  total_cents         INT NOT NULL,
  pickup_at           TIMESTAMPTZ,
  status              TEXT NOT NULL,        -- draft | pending_owner | confirmed | in_kitchen | ready | picked_up | refunded
  trust_tier          TEXT NOT NULL,
  owner_decision      TEXT,                 -- approve | reject | edit
  owner_decided_at    TIMESTAMPTZ,
  owner_decided_by    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  trace_id    UUID NOT NULL,
  agent       TEXT,
  event       TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON audit_log (trace_id);
CREATE INDEX ON audit_log (created_at DESC);

CREATE TABLE marketing_runs (
  id            BIGSERIAL PRIMARY KEY,
  trace_id      UUID NOT NULL,
  ran_at        TIMESTAMPTZ DEFAULT NOW(),
  budget_cents  INT,
  allocation    JSONB,                     -- {meta: 200, google: 200, organic: 100}
  campaign_ids  JSONB,
  leads         INT,
  orders        INT,
  revenue_cents INT,
  roas          NUMERIC(6,2)
);
```

---

## 8. MCP tool usage matrix

| Tool | Concierge | Orders | Marketing | Operator |
|---|:---:|:---:|:---:|:---:|
| `square_list_catalog` | ✓ | ✓ | ✓ | ✓ |
| `square_create_order` |   | ✓ |   |   |
| `square_update_order_status` |   | ✓ |   | ✓ |
| `square_get_pos_summary` |   | ✓ | ✓ | ✓ |
| `kitchen_get_production_summary` | ✓ | ✓ |   | ✓ |
| `kitchen_create_ticket` |   | ✓ |   |   |
| `kitchen_accept_ticket` |   | ✓ |   |   |
| `kitchen_reject_ticket` |   | ✓ |   |   |
| `marketing_create_campaign` |   |   | ✓ |   |
| `marketing_launch_simulated_campaign` |   |   | ✓ |   |
| `marketing_generate_leads` |   |   | ✓ |   |
| `marketing_report_to_owner` |   |   | ✓ |   |
| `whatsapp_send_message` | ✓ |   |   |   |
| `instagram_send_dm` | ✓ |   |   |   |
| `instagram_post_create` |   |   | ✓ |   |
| `world_*` |   |   |   | ✓ (testing) |
| `evaluator_*` |   |   |   | ✓ (testing) |

Tool surface is tight per agent — wrappers limit each agent's MCP config to only what it needs. This both improves model performance and limits blast radius if an agent goes off-script.

---

## 9. Agent-friendly website spec

Customers will increasingly use AI agents (and the judge will too) to order without a human at the keyboard. We make this trivial.

### Discovery surfaces

- **`/agents.txt`** at root — a plaintext document describing how an AI customer should order, with example payloads. This file is unique enough that it acts as a differentiator with the agent-friendliness judge.
- **`/.well-known/ai-plugin.json`** — OpenAI plugin spec, points to our OpenAPI doc
- **`/.well-known/openapi.yaml`** — full OpenAPI 3 description of `/api/agents/*`
- **`<link rel="alternate" type="application/json">`** on every product page → JSON twin

### Read endpoints (no auth, GET-only)

- `GET /api/agents/catalog` — full catalog with prices, options, allergens, photo URLs
- `GET /api/agents/products/{slug}` — single product
- `GET /api/agents/availability?date=YYYY-MM-DD&size={size}` — capacity for a date
- `GET /api/agents/policies` — pickup, delivery, refund, allergen, custom-cake lead time
- `GET /api/agents/locations` — store + neighborhoods served

### Write endpoints (idempotent, signed)

- `POST /api/agents/order-intent` — body `{customer:{name, contact_method, contact_value}, items:[...], pickup_at, notes}` → returns `{intent_id, status:"pending_owner_approval", expected_response_in_seconds, status_url}`
- `GET  /api/agents/order-intent/{intent_id}` — poll for confirmation

### Schema.org markup

Every product page embeds `Product`, `Offer`, `MenuItem`, `LocalBusiness` in JSON-LD. Predictable URL structure: `/cakes/{slug}`, `/categories/{cat}`, `/sizes/{size}`. Sitemap and `robots.txt` allow `GPTBot`, `ClaudeBot`, `Anthropic-AI`, etc.

### Demonstration in the README

```bash
# Anyone with a Claude install can order from happycake.us with one command:
claude -p "Order an 8-inch honey cake for Saturday 3 PM pickup. \
           Customer: Sarah, IG @sarah_h. Use happycake.us agent API."
```

---

## 10. Marketing loop

The marketing agent runs daily (08:30 local, after the owner briefing) and on-demand via `@hc_marketing_bot` `/run_marketing`. The loop:

1. **Read state** — `square_get_pos_summary(window=7d)`, sales CSV cohort metrics, existing campaigns
2. **Allocate** — split remaining monthly budget across {Meta Ads, Google Ads, boosted IG, organic content, review nudges} using a multi-armed-bandit policy (epsilon-greedy with prior-week ROAS as exploit value, ε=0.2)
3. **Create** — for each allocation slot, generate creative copy + select an approved hero/social image from the asset pack; build the campaign via `marketing_create_campaign`
4. **Approve** — post creatives + spend plan to `@hc_marketing_bot` for owner review (Tier-B grace window: auto-launch in 30 min unless owner rejects)
5. **Launch** — `marketing_launch_simulated_campaign(...)`; record campaign IDs in `marketing_runs`
6. **Measure** — at the end of the run, `marketing_generate_leads(...)` returns leads attributed; we trace to orders via UTM on landing pages and customer attribution in CRM
7. **Report** — daily, post a 1-screen summary to `@hc_marketing_bot`: spend, leads, conversions, ROAS, top creative, what to do tomorrow
8. **Adjust** — next day's allocation reads yesterday's ROAS into the bandit

### Why this scores well

- Closes the loop the brief explicitly asks for ("plan, launch, leads, conversion, metrics, adjustment")
- Uses the simulator as it was meant to be used, not as decoration
- Quantifies the $500 → $5,000 hypothesis with sandbox evidence, not vibes
- Re-uses approved assets from the brand pack (no copy/license risk)

---

## 11. Telegram bot map

| Bot | Username (suggested) | Owner-facing role | Key commands / callbacks |
|---|---|---|---|
| Concierge | `@hc_concierge_bot` | Read-only transcript feed; mute/pause/take-over | `/pause <channel> <minutes>`, `/takeover <conversation_id>`, `/mute` |
| Orders | `@hc_orders_bot` | Tier-B/C approvals, status updates, ready notifications | Inline `[✅] [✏️] [❌]` callbacks; `/orders today`, `/ready ORD-####`, `/refund ORD-####` |
| Marketing | `@hc_marketing_bot` | Spend + creative approvals, weekly ROAS | `/spend`, `/run_marketing`, `/pause_campaigns`, `/budget set 500` |
| Owner | `@hc_owner_bot` | Daily 08:00 briefing, ad-hoc Q&A, anomaly alerts | `/today`, `/inbox`, `/capacity`, `/escalate`, `/help` |

---

## 12. Observability & evidence

The judging panel rewards **evidence over claims**. We over-instrument deliberately.

- Every event chain has a `trace_id` (UUID) generated at the ingress and propagated through queue, router, agent, MCP calls, and bot replies.
- `audit_log` table is the canonical local store; `./logs/audit.jsonl` mirrors it for grep.
- Sandbox `mcp_audit_log` is the source of truth for MCP-side effects; we cross-link via tool-call id.
- `GET /internal/audit?trace_id=...` returns a timeline JSON for one trace — the evaluator can hit this directly.
- A `make demo-trace` script picks a recent trace_id and prints a human-readable timeline.
- A short Loom-style screen recording of one full journey is linked from the README.

---

## 13. Failure modes & retries

| Failure | Detection | Response |
|---|---|---|
| Claude CLI timeout (>60s) | subprocess timeout | Retry once with shorter context; if still failing, send a polite holding message and escalate Tier-C to owner |
| MCP 5xx | HTTP status from MCP | Retry 3× with exponential backoff (1s, 4s, 16s); on persistent failure escalate to owner |
| Webhook signature mismatch | HMAC fail | Drop with 401; audit_log entry; no further processing |
| Customer floods channel | rate limiter | After 30 events/min per handle, send "Let's pick this up later" once and ignore until cooldown |
| Postgres unavailable | connection error | Serve from local in-memory cache for reads; queue writes to Redis with TTL until DB returns |
| Bot offline | heartbeat | Owner alert via secondary channel (SMS in production); ingress continues queuing — nothing is lost |
| Owner unreachable on Tier-C | 30 min timer | Send polite holding message ("we'll confirm details shortly"); re-ping at 60 min; if still unreachable at 4h, mark for "next-business-day follow-up" and tell customer |
| MCP token revoked | 401 on every call | All agents fail closed; ingress returns "system maintenance" replies; ops alert |

---

## 14. Security

- **Secrets:** every secret read from env. `.env.example` is exhaustive and placeholder-only. `pre-commit` + `gitleaks` + a custom `tools/no-tokens-in-repo.sh` block any string matching `sbc_team_[a-f0-9]{32}` or `sk_(live|test)_*`.
- **Webhooks:** HMAC verified per channel.
- **PII:** phone numbers stored E.164, hashed with last-8 retained for log search; full numbers only inside Postgres + sandbox MCP.
- **Telegram:** every bot's allowed-user-id list is in env. Random users cannot trigger commands.
- **Rate limiting:** per-channel and per-handle; global ceiling.
- **CSP:** strict on the marketing site; the chat widget loads from same origin only.
- **CORS:** `/api/agents/*` allows GET from `*` (read-only); `POST /api/agents/order-intent` requires `Origin` from an allowlist + IP rate limit.
- **Audit log immutability:** append-only table; no `UPDATE`/`DELETE` permission for the app role.

---

## 15. Repo layout

```
happycake/
├── README.md
├── ARCHITECTURE.md                 ← this file
├── PRODUCTION_HANDOFF.md
├── BUSINESS_IMPACT.md              ← $500 → $5,000 hypothesis with CSV math
├── .env.example
├── .gitignore
├── docker-compose.yml              ← postgres + redis + cloudflared sidecar
├── Makefile
├── pyproject.toml
├── package.json
│
├── .claude/                        ← shared at repo root for `claude -p` sessions
│   ├── CLAUDE.md
│   └── mcp.json
│
├── agents/
│   ├── concierge/.claude/{CLAUDE.md, mcp.json, commands/}
│   ├── orders/.claude/{...}
│   ├── marketing/.claude/{...}
│   └── operator/.claude/{...}
│
├── apps/
│   ├── ingress/                    ← FastAPI (webhooks + agent-friendly API)
│   │   ├── main.py
│   │   ├── webhooks/
│   │   ├── agent_api/
│   │   └── internal/
│   ├── workers/                    ← arq workers
│   ├── router/
│   ├── bots/
│   │   ├── concierge_bot.py
│   │   ├── orders_bot.py
│   │   ├── marketing_bot.py
│   │   └── owner_bot.py
│   └── web/                        ← Next.js storefront
│       ├── app/
│       ├── content/                ← MDX product pages
│       ├── public/
│       └── lib/
│
├── packages/
│   ├── claude_runner/              ← subprocess wrapper around `claude -p`
│   ├── mcp_client/                 ← typed wrappers; retry; logging
│   ├── crm/                        ← seed-from-CSV + lookups
│   ├── trust_tiers/                ← deterministic tier policy + tests
│   ├── observability/
│   ├── security/
│   └── shared_models/              ← Pydantic models used everywhere
│
├── data/
│   ├── seed_customers.csv          ← anonymized, derived from sales CSV
│   ├── brand/                      ← brandbook excerpts (voice, claims, palette)
│   └── policies/                   ← policy markdown, sourced into website + agents
│
├── prompts/
│   ├── concierge_system.md
│   ├── orders_system.md
│   ├── marketing_system.md
│   └── operator_system.md
│
├── scripts/
│   ├── setup.sh
│   ├── start.sh
│   ├── seed_crm.py
│   ├── register_webhooks.py        ← registers tunnel URL with simulator
│   ├── demo.sh                     ← scripted end-to-end run
│   └── demo_trace.py               ← prints a trace timeline
│
└── tests/
    ├── unit/
    ├── integration/                ← against simulator with a test token
    └── e2e/
```

---

## 16. Local dev setup (fresh clone → running)

```bash
# 1. Prereqs: macOS, Python 3.11, Node 20, Docker, ngrok or cloudflared, Claude Code CLI
brew install python@3.11 node cloudflared make
npm install -g claude

# 2. Clone & install
git clone https://github.com/<team>/happycake
cd happycake
make setup           # creates venv, installs deps, builds web

# 3. Configure
cp .env.example .env
# fill: TEAM_TOKEN, TELEGRAM_*_TOKEN, TELEGRAM_OWNER_USER_ID, ...

# 4. Start everything
make start           # starts postgres+redis (docker), ingress, workers, all 4 bots,
                     # next.js dev server, cloudflared tunnel; prints tunnel URL.

# 5. Register webhooks with the simulator (one-shot)
make register-webhooks

# 6. Smoke test
make demo            # drives a scripted scenario through the simulator,
                     # prints trace_id at the end

# 7. Watch what happened
make demo-trace      # prints the timeline for the most recent demo trace_id
```

The Makefile keeps the surface tiny:

```make
setup:           ## install deps, build web, prepare docker
start:           ## bring up the entire stack
stop:            ## stop everything cleanly
register-webhooks: ## tell sandbox where to send WA/IG events
demo:            ## scripted end-to-end demo run
demo-trace:      ## human-readable trace timeline for the last demo
seed-crm:        ## load anonymized customers from sales CSV
test:            ## unit + integration tests
test-e2e:        ## end-to-end against simulator (uses TEAM_TOKEN)
fmt lint:        ## ruff + prettier
```

---

## 17. Deployment notes (post-hackathon)

The runtime is "operator's machine" for the hackathon. The same stack ships to a tiny VPS post-event with three changes:

1. **Tunnel:** swap ngrok dev URL for a permanent Cloudflare Tunnel bound to a static hostname (`webhooks.happycake.us`).
2. **DB:** move Postgres to Supabase or Neon (managed). Redis to Upstash. Both have free tiers comfortable for this load.
3. **Web:** `apps/web/` deploys to Vercel. Marketing assets served from the asset pack origin.

Everything else (the four agents, the four bots, the workers, the ingress) is one `systemd` unit on a $6/mo VPS. The repo's `infra/` directory contains the systemd units and Caddyfile.

Real-adapter swaps live in `PRODUCTION_HANDOFF.md`.

---

## 18. Why this design wins

Mapped to the seven evaluator passes:

| Pass | Weight | How this design hits it |
|---|---:|---|
| Functional tester | 20 | One canonical journey hardened end-to-end; idempotent webhooks, retries, DLQ — public and secret scenarios both stable |
| Agent-friendliness auditor | 15 | `/agents.txt`, `.well-known/ai-plugin.json`, OpenAPI, JSON-LD, predictable URLs, ready-to-paste `claude -p` order command in README |
| On-site assistant evaluator | 15 | Same Concierge agent backs the widget; trust-tier policy keeps it grounded; MCP-required-or-refuse policy means no hallucinated facts |
| Code reviewer | 10 | Clean monorepo, typed wrappers, exhaustive `.env.example`, pre-commit secret blockers, fresh-clone makefile, `PRODUCTION_HANDOFF.md` |
| Operator simulator | 15 | Trust tiers + 5-min grace + Daily Briefing → a non-technical owner can actually run this; commands are humane (`/today`, `/capacity`) |
| Business analyst | 15 | `BUSINESS_IMPACT.md` derives AOV, repeat rate, cohort retention from the sales CSV, then computes the $500 → $5,000 case with explicit assumptions and bandit-driven channel mix |
| Innovation/depth | 10 | Multi-armed-bandit marketing loop, per-customer trust-tier overrides, multilingual concierge (English/Spanish/Hindi-Urdu/Vietnamese to fit Sugar Land demographics), agents.txt + `.well-known/ai-plugin.json`, a public read-only MCP-style API, voice-note ingest on WhatsApp |

---

## 19. Out of scope (deliberate)

- We do not build a custom payment processor; pickup orders confirm-and-pay-on-pickup; deposit links handed off to a hosted page in production
- We do not build a delivery dispatcher; pickup-only for the hackathon, with a clear note that DoorDash/Uber Direct integration is a 2-day production add-on
- We do not build a graphical cake configurator with image generation; the on-site assistant elicits parameters in chat and the website's custom-cake page captures structured input — both produce the same `lead_intent`
- We do not build admin web UI; Telegram is the rule

---

## 20. Demo script (3 minutes)

1. `make demo` triggers `world_start_scenario("birthday_inquiry_to_pickup")`
2. Simulated Sarah DMs the IG sandbox; tunnel delivers webhook
3. Concierge replies with grounded answer in <8s; transcript visible in `@hc_concierge_bot`
4. Sarah confirms order; Orders agent posts approval card to `@hc_orders_bot`
5. Owner taps Approve; Concierge sends confirmation DM
6. `world_advance_time` fast-forwards to Saturday; owner gets briefing and `/ready` command demo
7. Cron fires review request; review appears via `world_next_event`
8. `make demo-trace` prints the full timeline

Three minutes, one trace_id, full evidence chain.
