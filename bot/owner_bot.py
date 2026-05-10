import asyncio
import json
import logging
import os
import sys
import uuid

from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from api.audit import write_event
from api.claude_runner import run as claude_run
from api.prompts import build_briefing_prompt, build_marketing_prompt, build_order_decision_prompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_OWNER_BOT_TOKEN", "")
OWNER_ID = int(os.environ.get("TELEGRAM_OWNER_USER_ID", "0"))

PENDING_APPROVALS: dict[str, dict] = {}


def owner_only(func):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if update.effective_user.id != OWNER_ID:
            await update.message.reply_text("⛔ This bot is for the bakery owner only.")
            return
        return await func(update, context)
    return wrapper


@owner_only
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "HappyCake Owner Bot\n\n"
        "Commands:\n"
        "/today — Daily briefing\n"
        "/inbox — Pending Tier-C items\n"
        "/capacity — Kitchen capacity\n"
        "/spend — Marketing summary\n"
        "/run_marketing — Run marketing cycle\n"
        "/help — Show this message"
    )


@owner_only
async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await cmd_start(update, context)


@owner_only
async def cmd_today(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ Generating daily briefing...")
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    write_event(trace_id, "bot", "briefing_request", {})

    prompt = build_briefing_prompt()
    result = claude_run(prompt, trace_id=trace_id)

    reply = result.get("reply", "Could not generate briefing. Please try again.")
    write_event(trace_id, "bot", "briefing_response", {"length": len(reply)})

    if len(reply) > 4000:
        reply = reply[:4000] + "\n\n(truncated)"
    await update.message.reply_text(reply)


@owner_only
async def cmd_inbox(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not PENDING_APPROVALS:
        await update.message.reply_text("✅ No pending items. All clear!")
        return

    for order_id, order in list(PENDING_APPROVALS.items()):
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Approve", callback_data=f"approve_{order_id}"),
                InlineKeyboardButton("❌ Reject", callback_data=f"reject_{order_id}"),
            ]
        ])
        msg = (
            f"📋 Pending: {order_id}\n"
            f"Channel: {order.get('channel', '?')}\n"
            f"Tier: {order.get('tier', '?')}\n"
            f"Reason: {order.get('reason', '?')}\n"
            f"Message: {order.get('message', '')[:200]}"
        )
        await update.message.reply_text(msg, reply_markup=keyboard)


@owner_only
async def cmd_capacity(update: Update, context: ContextTypes.DEFAULT_TYPE):
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    prompt = "Call kitchen_get_production_summary and return a brief summary of today's kitchen capacity, pending orders, and available slots. Format for Telegram."
    result = claude_run(prompt, trace_id=trace_id)
    await update.message.reply_text(result.get("reply", "Could not fetch capacity."))


@owner_only
async def cmd_spend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    prompt = "Call square_get_pos_summary and provide a brief marketing spend and ROAS summary for the current period. Format for Telegram."
    result = claude_run(prompt, trace_id=trace_id)
    await update.message.reply_text(result.get("reply", "Could not fetch spend data."))


@owner_only
async def cmd_run_marketing(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📢 Starting marketing cycle...")
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    write_event(trace_id, "bot", "marketing_request", {})

    prompt = build_marketing_prompt()
    result = claude_run(prompt, trace_id=trace_id, timeout_s=120)

    reply = result.get("reply", "Marketing cycle failed. Please try again.")
    write_event(trace_id, "bot", "marketing_response", {"length": len(reply)})

    if len(reply) > 4000:
        reply = reply[:4000] + "\n\n(truncated)"
    await update.message.reply_text(reply)


@owner_only
async def cmd_escalate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text("Usage: /escalate <description>")
        return

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    write_event(trace_id, "bot", "manual_escalation", {"text": text})
    await update.message.reply_text(f"🚨 Escalation logged (trace: {trace_id})\n{text}")


@owner_only
async def cmd_ready(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /ready ORD-XXXX")
        return

    order_id = context.args[0]
    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    prompt = f"Mark order {order_id} as ready for pickup. Call kitchen_mark_ready with the order/ticket ID. Respond with a confirmation message."
    result = claude_run(prompt, trace_id=trace_id)
    await update.message.reply_text(result.get("reply", f"Attempted to mark {order_id} ready."))


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query.from_user.id != OWNER_ID:
        await query.answer("⛔ Owner only.")
        return

    await query.answer()
    data = query.data

    if data.startswith("approve_"):
        order_id = data[8:]
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        write_event(trace_id, "bot", "order_approved", {"order_id": order_id})

        order = PENDING_APPROVALS.pop(order_id, {})
        prompt = build_order_decision_prompt(
            order_id=order_id,
            decision="approve",
            channel=order.get("channel", "website"),
            customer_id=order.get("conversation_id", ""),
        )
        result = claude_run(prompt, trace_id=trace_id)
        await query.edit_message_text(f"✅ Approved: {order_id}\n{result.get('reply', 'Done')}")

    elif data.startswith("reject_"):
        order_id = data[7:]
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        write_event(trace_id, "bot", "order_rejected", {"order_id": order_id})

        order = PENDING_APPROVALS.pop(order_id, {})
        prompt = build_order_decision_prompt(
            order_id=order_id,
            decision="reject",
            channel=order.get("channel", "website"),
            customer_id=order.get("conversation_id", ""),
        )
        result = claude_run(prompt, trace_id=trace_id)
        await query.edit_message_text(f"❌ Rejected: {order_id}\n{result.get('reply', 'Done')}")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return

    trace_id = f"trace_{uuid.uuid4().hex[:12]}"
    text = update.message.text or ""
    prompt = f"""The bakery owner sent a message: "{text}"

Answer their question using MCP tools. Check catalog, kitchen, or sales data as needed. Be concise and helpful. Format for Telegram."""

    result = claude_run(prompt, trace_id=trace_id)
    await update.message.reply_text(result.get("reply", "I couldn't process that. Try a command like /today or /help."))

# Default handler for any other messages (owner only)
@owner_only
async def handle_default(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("May I remind you of the available commands? Use /help.")

def main():
    if not BOT_TOKEN:
        print("ERROR: TELEGRAM_OWNER_BOT_TOKEN not set in .env")
        sys.exit(1)
    if not OWNER_ID:
        print("ERROR: TELEGRAM_OWNER_USER_ID not set in .env")
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("today", cmd_today))
    app.add_handler(CommandHandler("inbox", cmd_inbox))
    app.add_handler(CommandHandler("capacity", cmd_capacity))
    app.add_handler(CommandHandler("spend", cmd_spend))
    app.add_handler(CommandHandler("run_marketing", cmd_run_marketing))
    app.add_handler(CommandHandler("escalate", cmd_escalate))
    app.add_handler(CommandHandler("ready", cmd_ready))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(MessageHandler(filters.ALL, handle_default)) # default messages handler func*

    logger.info("HappyCake Owner Bot starting (long-polling)...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
