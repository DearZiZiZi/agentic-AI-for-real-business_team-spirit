from enum import Enum
import os


class Tier(str, Enum):
    A = "A"
    B = "B"
    C = "C"


TIER_B_MAX_AOV_CENTS = int(os.environ.get("TIER_B_MAX_AOV_CENTS", "8000"))
TIER_B_GRACE_SECONDS = int(os.environ.get("TIER_B_GRACE_SECONDS", "300"))

ESCALATION_KEYWORDS = [
    "human", "manager", "refund", "complaint", "allergic", "allergy",
    "allergen", "sick", "wrong", "terrible", "awful", "disgusting",
    "lawyer", "sue", "custom", "wedding", "special",
]


def classify(
    intent: str,
    order_total_cents: int = 0,
    is_standard_sku: bool = True,
    has_allergen_concern: bool = False,
    is_complaint: bool = False,
    wants_human: bool = False,
    customer_message: str = "",
) -> tuple[Tier, str]:
    msg_lower = customer_message.lower()

    if wants_human or any(kw in msg_lower for kw in ["human", "manager", "person"]):
        return Tier.C, "Customer requested human handoff"

    if is_complaint or any(kw in msg_lower for kw in ["refund", "complaint", "wrong", "terrible", "awful", "disgusting"]):
        return Tier.C, "Complaint or refund request"

    if has_allergen_concern or any(kw in msg_lower for kw in ["allergic", "allergy", "allergen"]):
        return Tier.C, "Allergen concern requires owner review"

    if intent == "custom" or any(kw in msg_lower for kw in ["custom", "wedding", "special"]):
        return Tier.C, "Custom cake request"

    if order_total_cents > TIER_B_MAX_AOV_CENTS:
        return Tier.C, f"Order total ${order_total_cents/100:.2f} exceeds Tier-B threshold"

    if intent == "order" and is_standard_sku:
        return Tier.B, f"Standard order, auto-confirms in {TIER_B_GRACE_SECONDS}s unless owner rejects"

    return Tier.A, "Informational reply, no order action"
