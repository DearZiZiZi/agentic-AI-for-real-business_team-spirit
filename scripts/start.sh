#!/usr/bin/env bash
set -euo pipefail

echo "🎂 Starting HappyCake services..."
echo ""

trap 'echo "Stopping..."; kill $(jobs -p) 2>/dev/null; exit 0' SIGINT SIGTERM

source .env 2>/dev/null || true

echo "[1/4] Starting API server on :8080..."
.venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload &
sleep 2

echo "[2/4] Starting Telegram bot..."
.venv/bin/python -m bot.owner_bot &
sleep 1

echo "[3/4] Starting Next.js dev server on :3000..."
cd web && npm run dev &
cd ..
sleep 2

echo "[4/4] Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:8080 &
sleep 3

echo ""
echo "============================================"
echo "✅ All services running!"
echo ""
echo "  Website:  http://localhost:3000"
echo "  API:      http://localhost:8080"
echo "  Health:   http://localhost:8080/health"
echo ""
echo "Set TUNNEL_PUBLIC_URL in .env to the URL printed by cloudflared above."
echo "Then run: make register-webhooks"
echo "============================================"

wait
