# HappyCake US — Agentic AI for Real Business

> **[Steppe Business Club Hackathon](https://www.steppebusinessclub.com/hackathon)**

> **Full 100% AI judging is unreliable** because the judge (Claude 4.7) failed to verify whether the system actually works or is ready for production. Instead, it was triggered simply by the high number of agents used, even though the system was non-functional. This happened either because the judging system prompt was poorly configured or because Claude 4.7 lacks sufficient reasoning skills, as shown in top dynamic reasoning benchmarks.

End-to-end AI sales system for HappyCake US (Sugar Land, TX). Built on the Steppe Business Club hackathon runtime: **Claude Code CLI (Opus 4.7) + Telegram + Cloudflare Tunnel + hosted MCP sandbox**.

- Architecture → [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Build plan → [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)
- $500 → $5,000 math → [`BUSINESS_IMPACT.md`](./BUSINESS_IMPACT.md)
- Production swaps → [`PRODUCTION_HANDOFF.md`](./PRODUCTION_HANDOFF.md)

---

## What this is

One agent, one Telegram bot, one Python service, one Next.js website. The agent ("Concierge") handles customer chat across the website, WhatsApp, and Instagram, takes orders, and writes to the kitchen + Square + marketing simulator via the hosted MCP. Owner approves Tier-B/C orders on `@happycake_us_owner_bot`. Every event lands in `./logs/audit.jsonl` with a `trace_id` the evaluator can grep.

Brief explicitly allows a single super-agent. We use that to ship.

---

## Quick start (fresh clone → demo in five commands)

### Prereqs

- Python 3.11, Node 20, Make
- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) authenticated with a Claude Max subscription
- [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/installation/)
- One Telegram bot token from [@BotFather](https://t.me/BotFather) for `@happycake_us_owner_bot`
- Registered Telegram bot "HappyCakeUS Owner Bot": http://t.me/happycake_us_owner_bot (we can transfer ownership if needed ~ after the hackathon)
- How to get Telegram User ID? go here -> http://t.me/Getmyid_bot | send -> `/start` | then copy "Your ID".
- Team's `X-Team-Token` from the Steppe Business Club dashboard.

### Run

```bash
git clone https://github.com/DearZiZiZi/agentic-AI-for-real-business_team-spirit.git
cd happycake
make setup            # python venv + node deps
cp .env.example .env  # then fill the 5 required values below

make start            # api + owner bot + web + cloudflared; prints tunnel URL
make register-webhooks # registers tunnel URL with the sandbox
make demo             # scripted end-to-end customer journey; prints trace_id
make demo-trace       # prints the timeline of the last demo
```

The five required env values:

```
TEAM_TOKEN=sbc_team_...
TELEGRAM_OWNER_BOT_TOKEN=...
TELEGRAM_OWNER_USER_ID=...
INTERNAL_AUDIT_TOKEN=<any random string>
TUNNEL_PUBLIC_URL=<printed by `make start`>
```

After `make start` you should see:

- `http://localhost:3000` — the HappyCake website
- `http://localhost:8080/health` — API health check
- `https://<id>.trycloudflare.com` — public tunnel URL
- `@happycake_us_owner_bot` online in Telegram

---

## What the evaluator should hit first

1. **Visit the site:** `http://localhost:3000` — catalog, prices, custom-cake page, on-site assistant widget bottom-right.
2. **Hit the agent-friendly API:**
   ```bash
   curl http://localhost:8080/api/agents/catalog | jq .
   curl 'http://localhost:8080/api/agents/availability?date=2026-05-16' | jq .
   ```
3. **Order from the site as an AI customer:**
   ```bash
   claude -p "Order an 8-inch honey cake for Saturday 3 PM pickup. \
              Customer: Test Buyer. Use http://localhost:8080/api/agents."
   ```
4. **Drive a scenario:** `make demo` runs a scripted Instagram-DM-to-pickup journey and prints a `trace_id`.
5. **Read the evidence:**
   ```bash
   curl -H "Authorization: Bearer $INTERNAL_AUDIT_TOKEN" "http://localhost:8080/internal/audit?trace_id=<id>" | jq .
   ```
6. **Open Telegram:** `/today` on `@happycake_us_owner_bot` returns the daily briefing.

---

## On-site assistant test script

Same Concierge agent backs the widget, WhatsApp, and Instagram. We harden five scenarios:

| Scenario | Input | Expected |
|---|---|---|
| Consultation | "Cake for a 5-year-old's mermaid party for 12 kids" | 2-3 clarifying questions, suggests 8" round + cupcakes from catalog with prices, capacity-checks date |
| Custom order | "3-tier wedding cake, half lemon half chocolate, 80 servings" | Captures spec, classifies Tier-C, schedules owner consultation, holds reply until owner approves |
| Complaint | "My birthday cake yesterday was dry and wrong flavor" | Empathic acknowledgement, no admission of fault, escalates Tier-C immediately, offers holding response |
| Order status | "Where's order ORD-1042?" | Looks up via `square_*`, returns kitchen status + ETA, never invents |
| Escalation | "I want to talk to a human" | Immediate handoff acknowledgement, conversation marked `human-only`, owner pinged |

Run them all:

```bash
make test-assistant
```

---

## Telegram bots

| Bot | Username | Role |
|---|---|---|
| Owner | `@happycake_us_owner_bot` | All owner interaction: daily briefing, order approvals, marketing controls, ad-hoc queries |

One bot is enough. The brief allows it ("one super-agent"). If we have time we add a read-only `@hc_inbox_bot` as a transcript feed.

Owner commands:

- `/today` — daily briefing (capacity, pending Tier-C, yesterday's revenue, marketing summary)
- `/inbox` — pending Tier-C items
- `/capacity` — kitchen capacity for today/tomorrow
- `/spend` — marketing spend & ROAS so far this month
- `/run_marketing` — kicks off the marketing cycle
- `/escalate <text>` — manually flag a conversation
- `/ready ORD-####` — mark order ready for pickup
- `/help`

Inline buttons on order cards: `[✅ Approve]`, `[❌ Reject]`, `[✏️ Edit]`.

---

## Brand voice & assets

System prompt is built from `data/brand.md`:

- Voice: warm, concise, local. Never slangy. Never over-promising.
- Approved claims: only what MCP returns. No "halal-certified" unless the data says so. No allergen guarantees beyond "made in a kitchen with nuts/dairy/eggs."
- Refusal templates for medical claims, allergen guarantees, refunds.

Visual assets from the official HappyCake pack (logo + 22 optimized images). Brand colors:

| Color | Hex | Use |
|---|---|---|
| Happy Blue 900 | `#0E2A3C` | Primary dark, hero, header |
| Happy Blue 700 | `#1B4868` | Secondary dark |
| Happy Blue 500 | `#3B7BA8` | Links, accents |
| Cream 50 | `#FBF6E8` | Backgrounds, body |
| Cream 100 | `#F4ECD3` | Cards |
| Coral | `#E08066` | CTAs, promo stickers |
| Green | `#6E9D74` | Success states |

---

## Agent-friendly notes

- `/agents.txt` at root — plaintext "how to order" doc for AI customers
- `/.well-known/ai-plugin.json` — points at OpenAPI spec
- All product pages embed JSON-LD `Product`, `Offer`, `MenuItem`
- Predictable URLs: `/cakes/{slug}`, `/categories/{cat}`
- `GET /api/agents/{catalog,availability,policies,products/{slug}}` — read-only, no auth
- `POST /api/agents/order-intent` — write, idempotent via `Idempotency-Key`

---

## Repo layout

```
happycake/
├── README.md, ARCHITECTURE.md, BUSINESS_IMPACT.md, PRODUCTION_HANDOFF.md, IMPLEMENTATION_PLAN.md
├── .env.example, Makefile, requirements.txt, .gitignore
├── .claude/
│   ├── CLAUDE.md
│   ├── mcp.json
│   └── commands/{customer_reply,order_decision,run_marketing,owner_briefing}.md
├── api/
│   ├── main.py             # FastAPI, all endpoints in one file
│   ├── claude_runner.py    # subprocess wrapper around `claude -p`
│   ├── mcp_proxy.py        # thin httpx wrapper for /api/agents/*
│   ├── tiers.py            # deterministic Tier A/B/C
│   ├── audit.py            # JSONL writer/reader
│   └── prompts.py          # prompt builders per channel
├── bot/
│   └── owner_bot.py        # python-telegram-bot, long-polling
├── web/                    # Next.js
│   ├── app/
│   ├── components/
│   ├── data/catalog.json
│   ├── public/agents.txt
│   ├── public/.well-known/ai-plugin.json
│   └── public/brand/
├── data/{brand.md, policies.md, catalog_seed.json, assets-manifest.json}
├── prompts/system.md
├── scripts/{start,stop,register_webhooks,demo,demo_trace}.sh
└── logs/                   # gitignored
```

---

## Tests

```bash
make test            # unit tests for tiers + audit + prompt builders
make test-assistant  # the 5 on-site assistant scenarios against the live stack
make test-e2e        # full end-to-end against the simulator
```

---

## Security

- All secrets via env. `.env.example` is exhaustive.
- `.env` and `logs/` in `.gitignore` from the first commit.
- HMAC validation on webhooks (warned-only if sandbox doesn't sign).
- `INTERNAL_AUDIT_TOKEN` gates `/internal/audit`.
- Owner-only Telegram commands check `TELEGRAM_OWNER_USER_ID`.

**Never commit your team token.** It belongs only in your local `.env`.

---

## Production handoff

[`PRODUCTION_HANDOFF.md`](./PRODUCTION_HANDOFF.md) lists the eight changes to ship to a real HappyCake customer (real WhatsApp Cloud API, real Square credentials, real domain, etc.). Named, file-line referenced, no real code shipped.

---

## License

Built on the Steppe Business Club hackathon runtime. Approved HappyCake brand assets used under the hackathon brief license; do not redistribute outside this repo.
