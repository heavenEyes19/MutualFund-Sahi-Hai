import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";

import MessageBubble from "@/components/ai/MessageBubble";
// import TypingIndicator from "@/components/ai/TypingIndicator";
import EmptyState from "@/components/ai/EmptyState";

const SUGGESTED_PROMPTS = [
  "Best funds for long term",
  "Compare HDFC vs SBI funds",
  "Low risk investment options",
];

const AIAdvisory = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (msg) => {
    const text = (msg !== undefined ? msg : input).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { type: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.reply || "No response",
          funds: data.funds || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Server error. Try again." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="flex h-full p-4 lg:p-8">
      <div className="flex flex-col w-full bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Sparkles size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AI Advisory</h1>
            <p className="text-[11px] text-gray-500">Powered by Mutual-Funds Sahi Hai</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.length === 0 ? (
            <EmptyState onPrompt={sendMessage} />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={msg.text + i} msg={msg} />
            ))
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length > 0 && !loading && (
          <div className="px-5 py-2 flex gap-2 overflow-x-auto border-t border-gray-800">
            {SUGGESTED_PROMPTS.map((label, i) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-800">
          <div className="flex gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) sendMessage();
              }}
              placeholder="Ask about mutual funds..."
              className="flex-1 bg-transparent text-sm text-gray-200 outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAdvisory;