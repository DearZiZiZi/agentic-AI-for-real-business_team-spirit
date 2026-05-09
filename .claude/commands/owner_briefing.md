# Owner Daily Briefing

Generate a concise daily briefing for the bakery owner.

## Steps

1. Call `square_get_pos_summary` for yesterday's sales and revenue.
2. Call `kitchen_get_production_summary` for today's capacity and pending orders.
3. Review any pending Tier-C escalations (from conversation context if provided).
4. Summarize the last marketing run results if available.
5. Flag any anomalies: unusual order volume, capacity constraints, unresolved complaints.

## Output format
Return a formatted text summary (not JSON) suitable for Telegram:

```
📊 Daily Briefing — [Date]

💰 Yesterday's Revenue: $X,XXX (XX orders)
Top sellers: [product1], [product2]

🏭 Kitchen Today:
  Capacity: XX/XX slots filled
  Pending orders: XX
  Ready for pickup: XX

⚠️ Needs Attention:
  - [any Tier-C items]
  - [any anomalies]

📢 Marketing:
  Last run: [date]
  Leads this week: XX
  ROAS: X.Xx

Have a great day! 🎂
```
