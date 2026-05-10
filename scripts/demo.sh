#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"

echo "🎂 HappyCake Demo — Full Customer Journey"
echo "==========================================="
echo ""

echo "1. Health check..."
curl -sf "$API_URL/health" | python3 -m json.tool
echo ""

echo "2. Browsing catalog (as AI customer)..."
curl -sf "$API_URL/api/agents/catalog" | python3 -m json.tool
echo ""

echo "3. Checking availability..."
curl -sf "$API_URL/api/agents/availability?date=2026-05-16" | python3 -m json.tool
echo ""

echo "4. Customer chat — asking about cakes..."
RESPONSE=$(curl -sf "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"demo-1","message":"What cakes do you have? I need one for a birthday party this Saturday."}')
echo "$RESPONSE" | python3 -m json.tool
TRACE_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('trace_id',''))")
echo ""

echo "5. Customer follows up — placing an order..."
curl -sf "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"demo-1","message":"I'\''ll take the 8-inch chocolate cake for Saturday 3 PM pickup please. My name is Sarah."}' | python3 -m json.tool
echo ""

echo "6. AI customer places order via agent API..."
curl -sf "$API_URL/api/agents/order-intent" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-order-001" \
  -d '{"product":"honey cake","quantity":1,"pickup_date":"2026-05-16","pickup_time":"15:00","customer_name":"Test Buyer","notes":"8-inch please"}' | python3 -m json.tool
echo ""

echo "============================================"
echo "✅ Demo complete!"
echo "Trace ID: $TRACE_ID"
echo ""
echo "View the audit trail:"
echo "  curl \"$API_URL/internal/audit?trace_id=$TRACE_ID&token=\$INTERNAL_AUDIT_TOKEN\" | jq ."
