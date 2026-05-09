#!/usr/bin/env bash
set -euo pipefail

source .env 2>/dev/null || true

TUNNEL_URL="${TUNNEL_PUBLIC_URL:-}"

if [ -z "$TUNNEL_URL" ]; then
  echo "ERROR: TUNNEL_PUBLIC_URL not set. Run 'make start-tunnel' first and set it in .env"
  exit 1
fi

echo "Registering webhooks with sandbox..."
echo "  WhatsApp: ${TUNNEL_URL}/webhooks/whatsapp"
echo "  Instagram: ${TUNNEL_URL}/webhooks/instagram"
echo ""
echo "Use Claude CLI to register:"
echo ""
echo "  claude -p \"Register these webhook URLs with the sandbox:"
echo "    WhatsApp: ${TUNNEL_URL}/webhooks/whatsapp"
echo "    Instagram: ${TUNNEL_URL}/webhooks/instagram"
echo "  Use the appropriate MCP tools to register them.\""
echo ""
echo "Or register manually via the MCP endpoint."
