# Happy Cake — Implementation Plan

Hour-by-hour build plan from the time you start coding to the deadline. Designed for one builder; doubles up if there are two of you. Every step ends with a checkable artifact so you can stop early without losing the demo.

**Deadline:** May 10, 10:00 CT.
**Target:** ~14 hours of focused work plus a 1-hour buffer for the unknown.

---

## Golden rules

1. **Walking skeleton first.** End-to-end "customer message → Claude → reply" in the first 3 hours. Polish after.
2. **One canonical journey.** Instagram DM → order intake → owner approval → confirmation. Everything else is a variation.
3. **Stop adding features at hour 12.** Last 2 hours are docs, demo script, and submission.
4. **Commit every hour.** No 6-hour heroic refactors. If `make demo` breaks, `git revert` and move on.
5. **MCP is the source of truth.** No fake catalog data in code paths. If the sandbox returns it, use it. If it doesn't, log it and fall back gracefully.

---

## Phase 0 — Setup (30 min)

- [ ] `git init`, push empty repo to GitHub
- [ ] `.gitignore` includes `.env`, `logs/`, `web/.next/`, `__pycache__/`, `node_modules/`
- [ ] Drop the four .md files (this file, `ARCHITECTURE.md`, `README.md`, `BUSINESS_IMPACT.md` skeleton) in the repo
- [ ] `.env.example` committed; `.env` filled locally with `TEAM_TOKEN`, Telegram bot token, owner user id, audit token
- [ ] Install: `python3.11 -m venv .venv`, `npm create next-app@latest web`, `pip install fastapi uvicorn httpx python-telegram-bot[asyncio]`
- [ ] `cloudflared --version` works; `claude --version` works

**Artifact:** `git push` with a `chore: scaffolding` commit.

---

## Phase 1 — Walking skeleton (3h)

### 1.1 `.claude/` project (30 min)

- [ ] `.claude/CLAUDE.md` — short system prompt: brand voice 1 paragraph, "never invent facts" rule, list of MCP tools the agent may call, escalation triggers
- [ ] `.claude/mcp.json` — one server, hosted MCP, token from env
- [ ] Verify: `claude -p "list MCP tools available"` from the repo root prints the sandbox tools

### 1.2 Claude runner (30 min)

- [ ] `api/claude_runner.py` — `run(prompt, trace_id, timeout_s=60) -> dict` that subprocesses `claude -p PROMPT --output-format json --mcp-config .claude/mcp.json`, parses stdout, writes a JSONL line to `./logs/audit.jsonl`
- [ ] `api/audit.py` — `write_event(trace_id, agent, event, payload)` and `read_trace(trace_id)`

### 1.3 FastAPI minimum (1h)

- [ ] `api/main.py`:
  - `GET /health` → `{ok: True}`
  - `POST /api/chat` → accepts `{conversation_id, message}`, builds prompt, calls `claude_runner.run`, returns `{reply, trace_id}`
  - `GET /internal/audit` → reads JSONL, returns timeline
- [ ] `make start-api` runs it on `:8080`

### 1.4 First end-to-end (1h)

- [ ] `curl -X POST localhost:8080/api/chat -d '{"conversation_id":"t1","message":"What cakes do you have today?"}'`
- [ ] Reply is grounded (Claude called `square_list_catalog`, response references real items from the sandbox)
- [ ] `./logs/audit.jsonl` has at least 3 lines for that trace_id

**Artifact:** screen recording of the curl returning a real reply.

---

## Phase 2 — Telegram owner bot (2h)

### 2.1 Bot bones (1h)

- [ ] `bot/owner_bot.py` — python-telegram-bot, long-polling, owner-id check
- [ ] Commands: `/start`, `/help`, `/today` (stub returning fixed string)
- [ ] `make start-bot` runs it; `/start` from your Telegram works

### 2.2 Approval flow (1h)

- [ ] `api/tiers.py` — pure function classifying `(action, draft_order, customer_history)` → `Tier.A | Tier.B | Tier.C` with reason; 5-minute grace constant
- [ ] When `claude_runner` returns a draft order with Tier B/C, post a Telegram message with inline buttons `approve_<id>` / `reject_<id>` / `edit_<id>`
- [ ] Button callback re-invokes `claude_runner` with `/order_decision` slash command and decision context
- [ ] On approve → `square_update_order_status(confirmed)` + `kitchen_accept_ticket` (these calls happen inside Claude via the slash command prompt)

**Artifact:** record yourself approving an order in Telegram and seeing `audit.jsonl` capture the chain.

---

## Phase 3 — Webhooks: WhatsApp + Instagram (2h)

### 3.1 Cloudflared tunnel (15 min)

- [ ] `scripts/start.sh` launches `cloudflared tunnel --url http://localhost:8080` and parses the public URL into `TUNNEL_PUBLIC_URL` in `.env`
- [ ] `scripts/register_webhooks.sh` calls the sandbox MCP to register `<tunnel>/webhooks/whatsapp` and `<tunnel>/webhooks/instagram`

### 3.2 Webhook handlers (1h)

- [ ] `POST /webhooks/whatsapp` and `POST /webhooks/instagram` in `api/main.py`
- [ ] Both: validate HMAC if signed, dedupe via in-memory set keyed on event id, generate `trace_id`, build prompt with channel context, call `claude_runner.run`
- [ ] The agent replies via `whatsapp_send_message` or `instagram_send_dm` MCP tool inside the same Claude call

### 3.3 Smoke (45 min)

- [ ] Drive a sandbox scenario through `world_start_scenario`; verify webhook fires; verify reply appears in the simulator state
- [ ] Verify same `trace_id` ties webhook → claude → MCP send → audit log

**Artifact:** `make demo` script driving one scenario start to finish.

---

## Phase 4 — Website (3h)

### 4.1 Next.js scaffolding (45 min)

- [ ] `web/app/layout.tsx`, `web/app/page.tsx` — hero with brand colors `#00AEEA`/`#6B3A1E`/`#FFF7EA`/`#E94B7B`, hero image from the asset pack
- [ ] `web/app/cakes/page.tsx` — catalog grid pulling from `web/data/catalog.json` (snapshot from `square_list_catalog`)
- [ ] `web/app/cakes/[slug]/page.tsx` — product page with JSON-LD `Product`/`Offer`
- [ ] `web/app/custom/page.tsx`, `web/app/policies/page.tsx`, `web/app/about/page.tsx`

### 4.2 On-site assistant widget (45 min)

- [ ] `web/components/Assistant.tsx` — floating drawer bottom-right, posts to `${NEXT_PUBLIC_ASSISTANT_API}` (which proxies to the Python `/api/chat` via Next.js rewrite)
- [ ] Display reply, suggested actions, link to `/custom` for Tier-C handoff

### 4.3 Agent-friendly surfaces (1h)

- [ ] `web/public/agents.txt` — plain text "how to order" doc
- [ ] `web/public/.well-known/ai-plugin.json` — points at `/openapi.yaml`
- [ ] `web/public/openapi.yaml` — describes `/api/agents/*`
- [ ] In `api/main.py`: `GET /api/agents/catalog`, `/availability`, `/policies`, `/products/{slug}`, `POST /api/agents/order-intent`
- [ ] JSON-LD `LocalBusiness` on home; `Product` on product pages

### 4.4 Smoke (30 min)

- [ ] `claude -p "Order an 8-inch honey cake for Saturday 3 PM. Use http://localhost:8080/api/agents."` actually places an intent
- [ ] On-site widget chats a full consultation flow

**Artifact:** site renders, widget responds, AI customer can order via API.

---

## Phase 5 — Marketing loop (2h)

### 5.1 Slash command (45 min)

- [ ] `.claude/commands/run_marketing.md` — instructs Claude to: read `square_get_pos_summary`, allocate $500 across {Meta, Google, IG boost, organic} weighted by previous-week ROAS with 20% exploration, create + launch campaigns, generate leads, report

### 5.2 Wiring (45 min)

- [ ] `/run_marketing` command on `@hc_owner_bot` invokes `claude -p` with that slash command
- [ ] Result is posted as a one-screen Telegram summary
- [ ] Run logged to `./logs/audit.jsonl` with `trace_id`

### 5.3 Smoke (30 min)

- [ ] Run `/run_marketing` twice, 1 minute apart with `world_advance_time` between; verify second run picks up first run's ROAS

**Artifact:** screenshot of the Telegram report.

---

## Phase 6 — Trust tier polish + daily briefing (1.5h)

### 6.1 Trust tier tests (30 min)

- [ ] `tests/test_tiers.py` — 15 fixture cases covering A/B/C boundaries
- [ ] `make test` passes

### 6.2 Daily briefing (1h)

- [ ] `.claude/commands/owner_briefing.md` — instructs Claude to summarize: yesterday's orders & revenue, today's kitchen capacity, pending Tier-C inbox, last marketing run, anomalies
- [ ] `/today` command on the bot invokes it
- [ ] Bonus: schedule it daily at 08:00 local via `cron` or APScheduler in the bot process

**Artifact:** `/today` returns a useful one-screen brief.

---

## Phase 7 — Documentation, demo script, business case (2h)

### 7.1 BUSINESS_IMPACT.md (1h)

- [ ] Read the anonymized 6-month sales CSV
- [ ] Compute: AOV (cents), repeat rate, top-3 SKUs by margin, day-of-week distribution
- [ ] Project 90-day uplift: web/IG/WA conversion + repeat nudges
- [ ] Document the $500 allocation logic, expected leads, expected conversion rate, expected revenue
- [ ] Conclude: $500 → ~3.5x effective ROAS → Y dollars over 90 days

### 7.2 PRODUCTION_HANDOFF.md (30 min)

- [ ] Eight named swaps with file:line references (MCP base URL, real WA Cloud API, real Square, real Telegram tokens, managed Postgres swap-in, persistent tunnel, SMS fallback, Google Business write access)

### 7.3 Final README polish (15 min)

- [ ] Five-command demo at the top is exactly correct on a fresh machine
- [ ] All bot commands documented
- [ ] Test scripts work

### 7.4 Demo script & trace (15 min)

- [ ] `scripts/demo.sh` runs `world_start_scenario("birthday_inquiry_to_pickup")`, drives the journey, prints `trace_id`
- [ ] `scripts/demo_trace.py` reads `./logs/audit.jsonl` and pretty-prints the trace timeline

**Artifact:** push final commit. README's quick-start works on a fresh clone.

---

## Phase 8 — Submission buffer (1h)

- [ ] Fresh-clone test: clone to a new directory, run the 5 commands, watch it work
- [ ] Loom-style screen recording of the demo (~3 min) linked in README
- [ ] Submit repo URL via the hackathon form
- [ ] Final commit before May 10, 10:00 CT
- [ ] Tag release `v1.0-submission`

---

## Backlog (only if Phases 0–8 finish early)

In priority order:

1. Multilingual concierge (auto-detect + reply in EN/ES/UR/HI/VI for Sugar Land)
2. Read-only `@hc_inbox_bot` transcript feed
3. Voice-note WhatsApp ingest (Whisper transcription)
4. Repeat-customer memory pulled from sales CSV ("Hi Sarah, last June you ordered…")
5. Review-request cron 24h after pickup
6. Hyper-local landing pages (`/lp/sugar-land-77479`)
7. Static cake configurator with composited preview from approved assets
8. Owner-side analytics screen (still in Telegram, not a web dashboard)

Each is independently shippable. Do them only after the core demo is rock solid.

---

## What we are deliberately NOT building

| Cut | Why |
|---|---|
| Multiple agents / multiple bots | Brief allows one super-agent. Saves ~6 hours. |
| Postgres + Redis + arq workers | JSONL + state.json suffices for demo. SQLite is the fallback. |
| Custom router service | Slash commands in `.claude/commands/` are the router. |
| structlog + Sentry + Prometheus | Plain logging + JSONL + one HTTP endpoint = enough evidence. |
| Pre-commit hooks + gitleaks | `.gitignore` discipline is enough at this scale. |
| shadcn/ui + design tokens | Plain Next.js + Tailwind utilities. The brand pack IS the design system. |
| Multi-armed-bandit Python code | Claude reasons about allocation in-prompt; MCP does the side effects. |
| Pyproject monorepo + workspaces | Flat `requirements.txt` + `package.json`. |
| Web admin dashboard | Brief explicitly forbids. Telegram only. |

---

## Hour-by-hour summary

| Hours | Phase | Output |
|------:|-------|--------|
| 0–0.5 | Phase 0 | Repo + envs + tools verified |
| 0.5–3.5 | Phase 1 | `/api/chat` → Claude → MCP → reply, with audit log |
| 3.5–5.5 | Phase 2 | Telegram bot + tier-based approvals working |
| 5.5–7.5 | Phase 3 | WhatsApp + IG webhooks, end-to-end via tunnel |
| 7.5–10.5 | Phase 4 | Site live, on-site widget working, agent-friendly API |
| 10.5–12.5 | Phase 5 | Marketing slash command + Telegram report |
| 12.5–14 | Phase 6 | Tier tests + daily briefing |
| 14–16 | Phase 7 | Docs, business case, production handoff, demo script |
| 16–17 | Phase 8 | Fresh-clone test + Loom + submit |

If you have a teammate, run Phase 4 (web) in parallel with Phases 1–3 (API + bot).
