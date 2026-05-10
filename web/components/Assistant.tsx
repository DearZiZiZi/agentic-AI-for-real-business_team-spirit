"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "customer" | "assistant";
  content: string;
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to HappyCake. How can we help you today? Browse our cakes, ask about availability, or place an order.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(
    () => `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "customer", content: text }]);
    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_ASSISTANT_API || "/api/chat";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: text,
          channel: "website",
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Let me check on that for you." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Apologies — we're having a moment. Please try again, or send us a message on WhatsApp.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-hb-700 text-cream-50 rounded-full shadow-lg hover:bg-hb-500 transition-all z-50 flex items-center justify-center text-xl font-body"
        aria-label={open ? "Close assistant" : "Chat with HappyCake"}
      >
        {open ? "✕" : "◆"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-xl shadow-2xl border border-hb-200 flex flex-col z-50 overflow-hidden">
          <div className="bg-hb-900 text-cream-50 px-4 py-3 flex items-center gap-3">
            <div>
              <div className="font-display font-semibold text-sm">
                HappyCake Assistant
              </div>
              <div className="text-xs text-cream-200 font-body">
                Cakes, prices, availability, orders
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm font-body ${
                    msg.role === "customer"
                      ? "bg-hb-700 text-cream-50 rounded-br-sm"
                      : "bg-cream-100 text-text rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream-100 text-text px-3 py-2 rounded-lg text-sm font-body">
                  <span className="animate-pulse">Checking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-hb-200/30 p-3 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about our cakes..."
              className="flex-1 px-3 py-2 border border-hb-200 rounded text-sm font-body focus:outline-none focus:border-hb-500 bg-cream-50"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-hb-700 text-cream-50 px-4 py-2 rounded text-sm font-body font-medium hover:bg-hb-500 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
