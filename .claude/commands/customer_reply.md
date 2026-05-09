# Customer Reply

Handle a customer message. Use MCP tools to ground every claim.

## Input
- `channel`: website | whatsapp | instagram
- `conversation_id`: unique conversation identifier
- `customer_message`: the customer's message
- `conversation_history`: prior messages in this conversation (JSON array)

## Steps

1. Read the customer message and conversation history.
2. Determine intent: browse, order, status check, complaint, custom request, or general question.
3. For product questions: call `square_list_catalog` or `square_search_catalog`.
4. For availability: call `kitchen_get_production_summary`.
5. For orders: call `square_create_order` with status=pending, then `kitchen_create_ticket` with status=pending.
6. For complaints/custom/escalation: return `escalation_required: true` with reason.
7. Reply in brand voice. Include prices from catalog, not from memory.

## Output format
Return JSON:
```json
{
  "reply": "message to customer",
  "intent": "browse|order|status|complaint|custom|general|escalation",
  "escalation_required": false,
  "order_id": null,
  "suggested_actions": ["View our catalog", "Place an order"],
  "tools_called": ["square_list_catalog"]
}
```
