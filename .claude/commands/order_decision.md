# Order Decision

Process an owner's approve/reject/edit decision on a pending order.

## Input
- `order_id`: the order ID
- `decision`: approve | reject | edit
- `edit_notes`: (if decision=edit) what the owner wants changed
- `customer_channel`: website | whatsapp | instagram
- `customer_id`: customer conversation identifier

## Steps

### If approved:
1. Call `kitchen_accept_ticket` for the order's kitchen ticket.
2. Call `square_update_order_status` with status=confirmed.
3. Send confirmation to customer via the appropriate channel tool (`whatsapp_send_message` or `instagram_send_dm`).

### If rejected:
1. Call `kitchen_reject_ticket` for the order's kitchen ticket.
2. Call `square_update_order_status` with status=cancelled.
3. Send a polite message to the customer explaining the order cannot be fulfilled, suggest alternatives.

### If edit:
1. Note the edit request and send it back for re-prompting.

## Output format
Return JSON:
```json
{
  "order_id": "...",
  "decision": "approve|reject|edit",
  "actions_taken": ["kitchen_accept_ticket", "square_update_order_status"],
  "customer_notified": true,
  "message_sent": "Your order has been confirmed..."
}
```
