# Happy Cake US — Agentic Sales & Operations System

Production-ready, end-to-end AI sales system for Happy Cake US (Sugar Land, TX), built on the Steppe Business Club hackathon runtime: **Claude Code CLI (Opus 4.7) + Telegram + Cloudflare Tunnel + hosted MCP sandbox**.

**Architecture:** see [`ARCHITECTURE.md`](./ARCHITECTURE.md).
**Business case:** see [`BUSINESS_IMPACT.md`](./BUSINESS_IMPACT.md).
**Production handoff:** see [`PRODUCTION_HANDOFF.md`](./PRODUCTION_HANDOFF.md).

---

## What this is

A four-agent system that turns Happy Cake's three sleepy customer channels (website, WhatsApp, Instagram) into one coherent sales engine, with Telegram as the owner's only interface.

| Agent | Bot | Role |
|---|---|---|
| **Concierge** | `@hc_concierge_bot` | Customer chat across web/WhatsApp/Instagram — grounded in MCP, brand-voice, multilingual |
| **Orders** | `@hc_orders_bot` | Capacity-checked order taking, trust-tiered approval, kitchen + POS handoff |
| **Marketing** | `@hc_marketing_bot` | Daily $500/mo allocation across Meta/Google/IG/organic via simulated multi-armed bandit |
| **Operator** | `@hc_owner_bot` | Daily 08:00 briefing, ad-hoc owner Q&A, anomaly alerts |

Every customer-facing fact is backed by a sandbox MCP call **in the same turn** — the agent literally cannot promise what the kitchen can't deliver. Every order gets a trace_id; the evaluator can grep one trace_id and see the entire customer journey.

---

## Quick start (fresh clone → running stack)

### Prerequisites

- macOS 13+ or Linux (Ubuntu 22+)
- Python 3.11
- Node 20
- Docker Desktop
- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) authenticated with a Claude Max subscription (Opus 4.7)
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/installation/) **or** [ngrok](https://ngrok.com/download)
- Four Telegram bot tokens from [@BotFather](https://t.me/BotFather) (one per agent)
- Your team's `X-Team-Token` from the Steppe Business Club dashboard

### Setup

```bash
git clone https://github.com/<your-team>/happycake
cd happycake

# install everything
make setup

# configure
cp .env.example .env
# fill in TEAM_TOKEN, TELEGRAM_*_TOKEN, TELEGRAM_OWNER_USER_ID, etc.

# start the full stack (postgres + redis + ingress + workers + 4 bots + web + tunnel)
make start

# in another shell, register the tunnel URL with the sandbox
make register-webhooks

# end-to-end smoke test
make demo

# read the trace
make demo-trace
```

After `make start`, you should see:

- `http://localhost:3000` — the Happy Cake storefront
- `http://localhost:8080/health` — ingress health check
- `https://<random>.trycloudflare.com` — tunnel URL (printed in logs)
- Four bots online in Telegram

### Stop

```bash
make stop
```

---

## What the evaluator should hit first

1. **Visit the site:** `http://localhost:3000` — catalog, prices, custom-cake page, on-site assistant widget bottom-right
2. **Try the agent-friendly API:**
   ```bash
   curl http://localhost:8080/api/agents/catalog | jq
   curl 'http://localhost:8080/api/agents/availability?date=2026-05-16&size=8in' | jq
   ```
3. **Order from the site as an AI customer:**
   ```bash
   claude -p "Order an 8-inch honey cake for Saturday 3 PM pickup. \
              Customer: Test Buyer. Use happycake.us agent API at \
              http://localhost:8080."
   ```
4. **Drive a scenario:** `make demo` — runs `world_start_scenario("birthday_inquiry_to_pickup")` end-to-end and prints a `trace_id`
5. **Read the evidence:** `curl "http://localhost:8080/internal/audit?trace_id=<id>" | jq` — full timeline of one customer journey
6. **Open Telegram:** the bots are live; `/today` on `@hc_owner_bot` returns the daily briefing

---

## On-site assistant test script

The on-site assistant (and the same Concierge agent backing WhatsApp + Instagram) has been hardened against five scenario classes:

| Scenario | What it tests | Expected behavior |
|---|---|---|
| **Consultation** | "I need a cake for a 5-year-old's mermaid party for 12 kids" | Asks 2-3 clarifying questions, suggests 8" round + cupcakes from catalog with prices, capacity-checks date |
| **Custom order** | "I want a 3-tier wedding cake, half lemon half chocolate, 80 servings" | Captures spec, classifies as Tier-C, confirms pricing window, schedules owner consultation, holds reply until owner approves |
| **Complaint** | "My birthday cake yesterday was dry and the wrong flavor" | Empathic acknowledgment, no admission of fault, escalates Tier-C immediately to owner with order lookup, offers holding response |
| **Order status** | "Where's order ORD-1042?" | Looks up order via `square_*`, returns kitchen status with pickup ETA, never invents |
| **Escalation** | "I want to talk to a human" | Immediate handoff acknowledgment, conversation marked `human-only`, owner pinged on `@hc_owner_bot` |

Run all five against the live stack:

```bash
make test-assistant
```

---

## Telegram bots

Each bot is a separate process, talks to the same Postgres + Redis, and receives Claude responses via the queue. Bot tokens live in `.env`. Owner-only commands check `TELEGRAM_OWNER_USER_ID` before executing.

| Bot | Username | Owner commands |
|---|---|---|
| Concierge | `@hc_concierge_bot` | `/pause <channel> <minutes>`, `/takeover <conv_id>`, `/mute` |
| Orders | `@hc_orders_bot` | inline `[✅ Approve] [✏️ Edit] [❌ Reject]`, `/orders today`, `/ready ORD-####`, `/refund ORD-####` |
| Marketing | `@hc_marketing_bot` | `/spend`, `/run_marketing`, `/pause_campaigns`, `/budget set 500` |
| Owner | `@hc_owner_bot` | `/today`, `/inbox`, `/capacity`, `/escalate`, `/help`, `/tier set <customer_id> <A\|B\|C>` |

The owner only really needs `@hc_owner_bot` and `@hc_orders_bot` day-to-day. The other two are read-only feeds.

---

## Repo layout (high level)

```
happycake/
├── ARCHITECTURE.md, BUSINESS_IMPACT.md, PRODUCTION_HANDOFF.md
├── .env.example, docker-compose.yml, Makefile
├── agents/{concierge,orders,marketing,operator}/.claude/
├── apps/
│   ├── ingress/   FastAPI webhooks + agent-friendly /api/agents/*
│   ├── workers/   arq workers
│   ├── router/    deterministic event router
│   ├── bots/      4 aiogram bot processes
│   └── web/       Next.js storefront
├── packages/
│   ├── claude_runner/  subprocess wrapper around `claude -p`
│   ├── mcp_client/     typed MCP wrappers + retry
│   ├── crm/            Postgres CRM seeded from sales CSV
│   ├── trust_tiers/    deterministic Tier A/B/C policy
│   ├── observability/  structlog + jsonl audit
│   └── security/       HMAC, secret guards, rate limit
├── data/{seed_customers.csv, brand/, policies/}
├── prompts/{concierge,orders,marketing,operator}_system.md
└── scripts/{setup, start, register_webhooks, demo, demo_trace}.sh
```

Full layout in [`ARCHITECTURE.md §15`](./ARCHITECTURE.md#15-repo-layout).

---

## Brand voice & assets

The Concierge agent's system prompt is built from `data/brand/`:

- Voice rules (warm, local, never slangy, never over-promising)
- Approved claims (e.g., "made fresh daily" — yes; "halal-certified" — only if MCP returns it)
- Refusal templates (allergen claims, medical claims, refunds)

Visual assets come from the official Happy Cake pack (22 optimized images + logo, see `data/brand/assets-manifest.json`):

| Color | Hex | Use |
|---|---|---|
| Happy Sky Blue | `#00AEEA` | Primary CTAs, wordmark accent |
| Chocolate Brown | `#6B3A1E` | Wordmark, dessert cues |
| Vanilla Cream | `#FFF7EA` | Backgrounds, cards |
| Bakery White | `#FFFFFF` | Logo safe space, surfaces |
| Berry Accent | `#E94B7B` | Promo stickers, social accents |

---

## Business impact hypothesis (the $500 → $5,000 case)

Full math in [`BUSINESS_IMPACT.md`](./BUSINESS_IMPACT.md). Headline:

- Current: ~$15-20K/month, ~all walk-in, repeat rate unknown
- Projected (90 days post-launch): +$8-12K/month from non-walk-in channels, with $500/mo media spend yielding ~3.5x effective ROAS via the closed-loop bandit (vs. 1.0x for blind spend)
- Mechanism: web + IG + WhatsApp converting at 4-7% (vs. 0% today), repeat rate lifted from ~25% to ~40% via 24-hour review nudges and 30/60/90-day repurchase prompts in CRM

The numbers are derived from the anonymized 6-month sales CSV, not assumed.

---

## Agent-friendly notes

- `/agents.txt` at root tells AI customers how to order
- `/.well-known/ai-plugin.json` exposes the OpenAPI spec
- All product pages embed Schema.org `Product`/`Offer`/`MenuItem` JSON-LD
- Predictable URLs: `/cakes/{slug}`, `/sizes/{size}`, `/categories/{category}`
- `GET /api/agents/{catalog,availability,policies,locations,products/{slug}}` — read-only, no auth
- `POST /api/agents/order-intent` — write, idempotent via `Idempotency-Key` header

---

## Tests

```bash
make test          # unit + integration
make test-e2e      # against the simulator with TEAM_TOKEN
make test-assistant# the 5 on-site assistant scenarios
```

CI runs the same on every push.

---

## Security

- All secrets via env. `.env.example` is exhaustive — every key the wrappers need.
- `pre-commit` hooks block strings matching `sbc_team_[a-f0-9]{32}` or `sk_(live|test)_*`.
- HMAC validation on every webhook with per-channel secrets.
- PII redaction in logs by default (phone numbers hashed last-8).
- Per-channel and global rate limiting.
- Audit log is append-only at the database role level.

**Never commit your team token.** It belongs only in your local `.env`.

---

## Production handoff

See [`PRODUCTION_HANDOFF.md`](./PRODUCTION_HANDOFF.md) for the explicit list of swaps to ship to a real Happy Cake customer (real WhatsApp Cloud API, real Square credentials, real domain, managed Postgres, etc.). Eight changes, fully enumerated, file-line referenced.

---

## License & attribution

Built on the Steppe Business Club hackathon runtime. Approved Happy Cake brand assets used under the hackathon brief license; do not redistribute outside this repo.
