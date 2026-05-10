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
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-coral text-cream-50 rounded-full shadow-lg hover:bg-coral-light hover:text-hb-900 transition-all z-50 flex items-center justify-center text-lg sm:text-xl font-body hover:scale-105"
        aria-label={open ? "Close assistant" : "Chat with HappyCake"}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md h-[70vh] sm:h-[520px] bg-white rounded-2xl shadow-2xl border border-hb-200/40 flex flex-col z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-hb-500 to-hb-400 text-cream-50 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/15 rounded-full flex items-center justify-center text-sm">
              &#x1F382;
            </div>
            <div>
              <div className="font-display font-semibold text-sm sm:text-base">
                HappyCake Assistant
              </div>
              <div className="text-xs text-cream-50/70 font-body">
                Cakes, prices, availability, orders
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-cream-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] px-3.5 sm:px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                    msg.role === "customer"
                      ? "bg-hb-400 text-cream-50 rounded-br-md"
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

          <div className="border-t border-hb-200/20 p-2.5 sm:p-3 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about our cakes..."
              className="flex-1 px-3.5 sm:px-4 py-2.5 border border-hb-200/40 rounded-xl text-sm font-body focus:outline-none focus:border-hb-400 focus:ring-2 focus:ring-hb-400/10 bg-cream-50 transition-all"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-coral text-cream-50 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-body font-semibold hover:bg-coral-light hover:text-hb-900 disabled:opacity-40 transition-all"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
