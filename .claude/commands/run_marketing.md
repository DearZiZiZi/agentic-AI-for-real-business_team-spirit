# Run Marketing Cycle

Execute a full marketing cycle: analyze performance, allocate budget, create campaigns, generate leads, report.

## Steps

1. Call `square_get_pos_summary` to get last 7 days of sales data.
2. Analyze: top products by revenue, day-of-week patterns, repeat customers.
3. Allocate $500 monthly budget across channels:
   - Weight by previous-week ROAS (return on ad spend)
   - Leave 20% for exploration (try underperforming channels)
   - Channels: Meta Ads, Google Ads, boosted Instagram, organic content
4. For each allocated channel:
   - Call `marketing_create_campaign` with creative copy and budget
   - Call `marketing_launch_simulated_campaign`
5. Call `marketing_generate_leads` to simulate lead generation
6. Call `marketing_report_to_owner` with a summary

## Output format
Return JSON:
```json
{
  "summary": "One-screen marketing summary for Telegram",
  "total_spent_cents": 12500,
  "campaigns_created": 3,
  "leads_generated": 15,
  "allocation": {
    "meta_ads": 4000,
    "google_ads": 3000,
    "instagram_boost": 3000,
    "organic": 2500
  },
  "top_performing": "Meta Ads",
  "recommendations": ["Increase Meta budget next week"]
}
```
