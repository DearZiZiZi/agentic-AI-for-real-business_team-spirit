import pytest
from api.tiers import Tier, classify


def test_general_question_is_tier_a():
    tier, _ = classify(intent="general", customer_message="What flavors do you have?")
    assert tier == Tier.A


def test_browse_is_tier_a():
    tier, _ = classify(intent="browse", customer_message="Show me your cakes")
    assert tier == Tier.A


def test_standard_order_is_tier_b():
    tier, _ = classify(intent="order", is_standard_sku=True, order_total_cents=4500, customer_message="I'll take the vanilla cake")
    assert tier == Tier.B


def test_high_aov_order_is_tier_c():
    tier, _ = classify(intent="order", is_standard_sku=True, order_total_cents=15000, customer_message="I want 3 large cakes")
    assert tier == Tier.C


def test_custom_request_is_tier_c():
    tier, _ = classify(intent="custom", customer_message="I want a custom wedding cake")
    assert tier == Tier.C


def test_complaint_is_tier_c():
    tier, _ = classify(intent="complaint", is_complaint=True, customer_message="My cake was terrible")
    assert tier == Tier.C


def test_allergen_concern_is_tier_c():
    tier, _ = classify(intent="order", has_allergen_concern=True, customer_message="My kid is allergic to nuts")
    assert tier == Tier.C


def test_human_request_is_tier_c():
    tier, _ = classify(intent="general", wants_human=True, customer_message="I want to talk to a human")
    assert tier == Tier.C


def test_refund_keyword_is_tier_c():
    tier, _ = classify(intent="general", customer_message="I want a refund for my order")
    assert tier == Tier.C


def test_wedding_keyword_is_tier_c():
    tier, _ = classify(intent="general", customer_message="I need a wedding cake for 200 people")
    assert tier == Tier.C


def test_manager_keyword_is_tier_c():
    tier, _ = classify(intent="general", customer_message="Let me speak to the manager")
    assert tier == Tier.C


def test_standard_order_below_threshold():
    tier, reason = classify(intent="order", is_standard_sku=True, order_total_cents=3500, customer_message="8 inch vanilla please")
    assert tier == Tier.B
    assert "auto-confirms" in reason


def test_standard_order_at_threshold():
    tier, _ = classify(intent="order", is_standard_sku=True, order_total_cents=8000, customer_message="Large chocolate cake")
    assert tier == Tier.B


def test_standard_order_above_threshold():
    tier, _ = classify(intent="order", is_standard_sku=True, order_total_cents=8001, customer_message="Two large cakes")
    assert tier == Tier.C


def test_special_keyword_is_tier_c():
    tier, _ = classify(intent="general", customer_message="I need something special for my daughter")
    assert tier == Tier.C
