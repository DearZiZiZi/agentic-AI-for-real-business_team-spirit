# HappyCake — Local Run Instructions

Step-by-step instructions to run the system locally. Works on macOS, Linux, and Windows (WSL).

---

## Prerequisites

| Tool | Version | Check command |
|---|---|---|
| Python | 3.10+ | `python3 --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Git | any | `git --version` |
| Claude Code CLI | latest | `claude --version` |
| cloudflared | latest | `cloudflared --version` |

You also need:
- An active **Claude Max subscription** (for Claude Code CLI)
- A **Telegram bot token** from [@BotFather](https://t.me/BotFather)
- Your **Telegram user ID** (get it from [@userinfobot](https://t.me/userinfobot))
- Your team's **X-Team-Token** from the Steppe Business Club dashboard

---

## Step 1: Clone the repository

```bash
git clone https://github.com/DearZiZiZi/agentic-AI-for-real-business_team-spirit.git
cd agentic-AI-for-real-business_team-spirit
```

---

## Step 2: Set up Python environment

### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install pytest
```

### Windows (WSL recommended)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install pytest
```

### Windows (PowerShell, no WSL)
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install pytest
```

---

## Step 3: Set up Node.js (website)

```bash
cd web
npm install
cd ..
```

---

## Step 4: Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in these **required** values:

```
TEAM_TOKEN=sbc_team_REPLACE_WITH_YOURS
TELEGRAM_OWNER_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_OWNER_USER_ID=your_numeric_telegram_id
INTERNAL_AUDIT_TOKEN=any_random_string_you_choose
```

Leave `TUNNEL_PUBLIC_URL` empty for now — you'll set it in Step 7.

---

## Step 5: Configure Claude Code MCP

Create or update `.claude/mcp.json` with your token:

```json
{
  "mcpServers": {
    "happycake": {
      "url": "https://www.steppebusinessclub.com/api/mcp",
      "headers": {
        "X-Team-Token": "sbc_team_YOUR_ACTUAL_TOKEN_HERE"
      }
    }
  }
}
```

Verify MCP works:
```bash
claude -p "Call square_list_catalog and list the products." --mcp-config .claude/mcp.json
```

You should see the sandbox catalog with real product data.

---

## Step 6: Start services (use separate terminals)

### Terminal 1: API server
```bash
# macOS / Linux
source .venv/bin/activate
make start-api

# Windows PowerShell
.venv\Scripts\Activate.ps1
.venv\Scripts\uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload
```

Test: open http://localhost:8080/health — should return `{"ok": true}`

### Terminal 2: Website
```bash
cd web
npm run dev
```

Test: open http://localhost:3000 — should show the HappyCake website

### Terminal 3: Telegram bot
```bash
# macOS / Linux
source .venv/bin/activate
make start-bot

# Windows PowerShell
.venv\Scripts\Activate.ps1
.venv\Scripts\python -m bot.owner_bot
```

Test: send `/start` to your bot in Telegram

### Terminal 4: Tunnel (for webhooks)
```bash
cloudflared tunnel --url http://localhost:8080
```

Copy the `https://xxxxx.trycloudflare.com` URL and set it in `.env`:
```
TUNNEL_PUBLIC_URL=https://xxxxx.trycloudflare.com
```

---

## Step 7: Register webhooks

After setting `TUNNEL_PUBLIC_URL` in `.env`:

```bash
claude -p "Register webhook URLs with the sandbox:
  WhatsApp: ${TUNNEL_PUBLIC_URL}/webhooks/whatsapp
  Instagram: ${TUNNEL_PUBLIC_URL}/webhooks/instagram
Use the appropriate MCP tools." --mcp-config .claude/mcp.json
```

---

## Step 8: Run tests

```bash
# Activate venv first
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows

# Unit tests
make test
# or: python -m pytest tests/ -v

# Quick API smoke test
curl http://localhost:8080/health
curl http://localhost:8080/api/agents/catalog
```

---

## Step 9: Run the demo

```bash
bash scripts/demo.sh
```

This runs a scripted customer journey: catalog browse → chat → order placement.

View the audit trail:
```bash
python scripts/demo_trace.py
```

---

## Step 10: Test Telegram commands

In your Telegram bot, try:
- `/today` — daily briefing
- `/inbox` — pending approvals
- `/capacity` — kitchen status
- `/run_marketing` — marketing cycle

---

## Troubleshooting

### "claude: command not found"
Install Claude Code CLI: https://docs.claude.com/en/docs/claude-code

### "TEAM_TOKEN not set"
Make sure `.env` exists and has `TEAM_TOKEN=sbc_team_...` filled in.

### API returns errors on /api/agents/catalog
Check that `TEAM_TOKEN` in `.env` matches the token in `.claude/mcp.json`.

### Telegram bot doesn't respond
- Check `TELEGRAM_OWNER_BOT_TOKEN` is correct
- Check `TELEGRAM_OWNER_USER_ID` matches your Telegram account
- The bot only responds to the owner — messages from other users are rejected

### Website shows dark/blank
The site forces light mode. If you see issues, clear browser cache and reload.

### Windows-specific
- Use WSL for the best experience
- If not using WSL, replace `source .venv/bin/activate` with `.venv\Scripts\Activate.ps1`
- `make` commands require GNU Make — install via chocolatey: `choco install make`
- Alternatively, run the commands from Makefile manually

---

## Quick Reference

| Service | URL | Port |
|---|---|---|
| API | http://localhost:8080 | 8080 |
| Website | http://localhost:3000 | 3000 |
| Health check | http://localhost:8080/health | 8080 |
| Catalog API | http://localhost:8080/api/agents/catalog | 8080 |
| Audit | http://localhost:8080/internal/audit (Bearer token) | 8080 |
