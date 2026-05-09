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
        "Hi! I'm the Happy Cake assistant. How can I help you today? 🎂",
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
        { role: "assistant", content: data.reply || "I'm here to help!" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting. Please try again in a moment!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-sky text-white rounded-full shadow-lg hover:bg-sky/90 transition-all z-50 flex items-center justify-center text-2xl"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-xl shadow-2xl border border-sky/20 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-sky text-white px-4 py-3 flex items-center gap-2">
            <span className="text-xl">🎂</span>
            <div>
              <div className="font-semibold text-sm">Happy Cake Assistant</div>
              <div className="text-xs text-white/80">
                Ask about cakes, prices, or place an order
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === "customer"
                      ? "bg-sky text-white rounded-br-sm"
                      : "bg-vanilla text-chocolate rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-vanilla text-chocolate px-3 py-2 rounded-lg text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-sky/10 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about our cakes..."
              className="flex-1 px-3 py-2 border border-sky/20 rounded-lg text-sm focus:outline-none focus:border-sky bg-vanilla"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-sky text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky/90 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
