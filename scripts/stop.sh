#!/usr/bin/env bash
echo "Stopping Happy Cake services..."
pkill -f "uvicorn api.main" 2>/dev/null || true
pkill -f "bot.owner_bot" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
echo "Done."
