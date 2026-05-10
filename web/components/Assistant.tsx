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
        "Welcome to HappyCake! How can we help you today? Browse our cakes, ask about availability, or place an order.",
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-coral text-cream-50 rounded-full shadow-lg hover:bg-coral-light hover:text-hb-900 transition-all z-50 flex items-center justify-center text-xl font-body hover:scale-105"
        aria-label={open ? "Close assistant" : "Chat with HappyCake"}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-2xl shadow-2xl border border-hb-200/40 flex flex-col z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-hb-900 to-hb-700 text-cream-50 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-coral/20 rounded-full flex items-center justify-center text-sm">
              🎂
            </div>
            <div>
              <div className="font-display font-semibold text-base">
                HappyCake Assistant
              </div>
              <div className="text-xs text-hb-200 font-body">
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
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                    msg.role === "customer"
                      ? "bg-hb-700 text-cream-50 rounded-br-md"
                      : "bg-white text-text rounded-bl-md shadow-sm border border-hb-200/20"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-text px-4 py-2.5 rounded-2xl rounded-bl-md text-sm font-body shadow-sm border border-hb-200/20">
                  <span className="animate-pulse">Checking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-hb-200/20 p-3 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about our cakes..."
              className="flex-1 px-4 py-2.5 border border-hb-200/40 rounded-xl text-sm font-body focus:outline-none focus:border-hb-500 focus:ring-2 focus:ring-hb-500/10 bg-cream-50 transition-all"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-coral text-cream-50 px-5 py-2.5 rounded-xl text-sm font-body font-semibold hover:bg-coral-light hover:text-hb-900 disabled:opacity-40 transition-all"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
