import json


def build_chat_prompt(
    message: str,
    conversation_id: str,
    channel: str = "website",
    history: list[dict] | None = None,
) -> str:
    history_block = ""
    if history:
        history_block = f"\n\nConversation history:\n{json.dumps(history[-10:], indent=2)}"

    return f"""You are the HappyCake US concierge agent. A customer on {channel} sent a message.

Brand: HappyCake (one word, two capitals). Cakes use names like: cake "Honey", cake "Napoleon".
Location: Sugar Land, TX. Voice: warm, plain English, specific, honest.

Conversation ID: {conversation_id}
Channel: {channel}
Customer message: {message}
{history_block}

Instructions:
1. Use MCP tools to look up real catalog data, prices, and kitchen availability. NEVER invent prices or products.
2. Reply in HappyCake voice — friendly, plain English, specific quantities and prices.
3. Close with a clear next step. "Order on the site at happycake.us or send a message on WhatsApp."
4. Three emojis maximum. Often zero.
5. If the customer wants to order, create the order via square_create_order and kitchen_create_ticket.
6. If this is a complaint, custom request, allergen concern, or they want a human — note escalation_required.

Respond with ONLY a JSON object (no markdown, no code fences):
{{
  "reply": "your message to the customer",
  "intent": "browse|order|status|complaint|custom|general|escalation",
  "escalation_required": false,
  "order_id": null,
  "order_total_cents": 0,
  "is_standard_sku": true,
  "suggested_actions": [],
  "tools_called": []
}}"""


def build_order_decision_prompt(
    order_id: str,
    decision: str,
    channel: str,
    customer_id: str,
    edit_notes: str = "",
) -> str:
    return f"""Process this order decision from the HappyCake owner.

Order ID: {order_id}
Decision: {decision}
Customer channel: {channel}
Customer conversation ID: {customer_id}
Edit notes: {edit_notes}

Instructions:
- If approved: call kitchen_accept_ticket, square_update_order_status(confirmed), and notify the customer.
- If rejected: call kitchen_reject_ticket, square_update_order_status(cancelled), and notify the customer politely.
- If edit: note what needs to change.

Send the customer notification via the appropriate channel tool (whatsapp_send_message for whatsapp, instagram_send_dm for instagram).
Use HappyCake voice. Close with a clear next step.

Respond with ONLY a JSON object:
{{
  "order_id": "{order_id}",
  "decision": "{decision}",
  "actions_taken": [],
  "customer_notified": true,
  "message_sent": "..."
}}"""


def build_marketing_prompt() -> str:
    return """Run a complete marketing cycle for HappyCake US (Sugar Land, TX).

Steps:
1. Call square_get_pos_summary for recent sales data.
2. Analyse top products, day-of-week patterns, and margin data.
3. Allocate the $500 monthly budget across: Meta Ads, Google Ads, Instagram boost, organic content.
   - Weight by ROAS from previous runs.
   - Reserve 20% for exploration.
   - Justify every dollar with margin data and a measurable hypothesis.
4. For each channel: call marketing_create_campaign with creative copy (HappyCake voice) and budget, then marketing_launch_simulated_campaign.
5. Call marketing_generate_leads.
6. Call marketing_report_to_owner with a summary.

Use HappyCake brand voice in all creative copy. Close every ad with: "Order on the site at happycake.us or send a message on WhatsApp."

Respond with ONLY a JSON object:
{
  "summary": "one-screen Telegram-friendly summary",
  "total_spent_cents": 0,
  "campaigns_created": 0,
  "leads_generated": 0,
  "allocation": {},
  "recommendations": []
}"""


def build_briefing_prompt() -> str:
    return """Generate a daily briefing for the HappyCake US owner.

Steps:
1. Call square_get_pos_summary for recent sales.
2. Call kitchen_get_production_summary for today's capacity.
3. Summarise: revenue, top sellers, kitchen status, pending items, anomalies.

Respond with a formatted text message (NOT JSON) suitable for Telegram. Use plain English, specifics over adjectives. Three emojis maximum.

Daily Briefing — [Date]

Revenue: $X,XXX (XX orders)
Top sellers: cake "Honey", cake "Napoleon"

Kitchen today:
- Capacity: XX/XX slots
- Pending: XX
- Ready for pickup: XX

Needs attention:
- [any issues]

Marketing:
- Last run: [date]
- Leads: XX
- ROAS: X.Xx

— the HappyCake team
"""
