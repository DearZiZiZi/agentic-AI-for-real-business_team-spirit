# HappyCake US — Production Handoff

Eight changes to ship this demo to a real HappyCake customer. Each is named with the file and line to change.

---

## 1. MCP Base URL → Real APIs

**File:** `.claude/mcp.json` (line 3-7)
**File:** `api/mcp_proxy.py` (line 4)
**File:** `.env` → `MCP_BASE_URL`

Replace the sandbox MCP endpoint with real integrations:
- WhatsApp Cloud API (Meta Business Platform)
- Instagram Graph API (Meta Business Platform)
- Square API (production credentials)
- Kitchen management system API

The `mcp_proxy.py` direct calls become real API calls. The agent's MCP config points to a self-hosted MCP server wrapping these real APIs.

---

## 2. Real Square Credentials

**File:** `.env` → `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`

Replace sandbox Square calls with production credentials:
- Production access token from Square Developer Dashboard
- Real location ID for the Sugar Land store
- Enable real payment processing for order deposits

---

## 3. Real Telegram Bot Tokens

**File:** `.env` → `TELEGRAM_OWNER_BOT_TOKEN`, `TELEGRAM_OWNER_USER_ID`

- Create production bot via @BotFather
- Set owner's real Telegram user ID
- Consider adding a second `@hc_inbox_bot` for read-only transcript feed

---

## 4. Permanent Cloudflare Tunnel

**File:** `scripts/start.sh` (line 20)
**File:** `.env` → `TUNNEL_PUBLIC_URL`

Replace `cloudflared tunnel --url` (random subdomain) with:
- Named Cloudflare Tunnel with a permanent hostname
- Custom domain: `api.happycake.us`
- Or: deploy FastAPI to a cloud provider (Railway, Fly.io, AWS)

---

## 5. Vercel Deploy for Website

**File:** `web/next.config.ts` (lines 6-14, rewrite destinations)

- Deploy `web/` to Vercel
- Update rewrite destinations to point to the production API URL
- Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ASSISTANT_API` to production URLs
- Configure custom domain: `happycake.us`

---

## 6. Postgres for State

**File:** `api/audit.py` (entire file)
**File:** `api/main.py` (lines 29-30, in-memory dicts)

Replace JSONL + in-memory state with:
- PostgreSQL for audit events (indexed by trace_id, created_at)
- PostgreSQL for conversations and pending orders
- Connection via `asyncpg` or `sqlalchemy[asyncio]`

SQLite swap (intermediate step):
- Replace `AUDIT_FILE` with SQLite via `sqlite3` stdlib
- Replace `CONVERSATIONS` and `PENDING_ORDERS` dicts with SQLite tables

---

## 7. SMS Fallback for Tier-C Timeouts

**File:** `bot/owner_bot.py` (add after line 85, in approval timeout handler)
**File:** `.env` → `TWILIO_SID`, `TWILIO_AUTH_TOKEN`

If owner doesn't respond to a Tier-C escalation within 15 minutes:
- Send SMS via Twilio to owner's phone
- After 30 minutes: auto-send holding message to customer
- After 60 minutes: auto-escalate to backup contact

---

## 8. Google Business Profile Write Access

**File:** `.claude/commands/run_marketing.md` (add Google Business step)
**File:** `.env` → Google Business API credentials

- Post updates to Google Business Profile
- Respond to Google reviews via the agent
- Sync menu/catalog to Google Business
- Track local search impressions in marketing reports

---

## Summary

| # | What | Where | Effort |
|---|---|---|---|
| 1 | Real APIs | `.claude/mcp.json`, `api/mcp_proxy.py` | 1 day |
| 2 | Square prod | `.env` | 1 hour |
| 3 | Telegram prod | `.env` | 30 min |
| 4 | Permanent tunnel | `scripts/start.sh`, `.env` | 2 hours |
| 5 | Vercel deploy | `web/next.config.ts` | 2 hours |
| 6 | Postgres | `api/audit.py`, `api/main.py` | 1 day |
| 7 | SMS fallback | `bot/owner_bot.py`, `.env` | 4 hours |
| 8 | Google Business | `.claude/commands/`, `.env` | 4 hours |

**Total estimated effort: ~3 days** for a developer familiar with the codebase.
