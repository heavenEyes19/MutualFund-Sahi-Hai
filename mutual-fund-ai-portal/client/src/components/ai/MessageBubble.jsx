import { Sparkles } from "lucide-react";
import FundCardGrid from "./FundCardGrid";

const formatFunds = (funds) => {
  if (!Array.isArray(funds)) return [];
  return funds.map((f) => ({
    name: f.name || "Unknown Fund",
    nav: f.nav ? `₹${f.nav}` : "N/A",
    change: typeof f.change90 === "number" ? f.change90 : 0,
    risk: "Medium",
    description: `Range ₹${typeof f.minNAV === "number" ? f.minNAV.toFixed(2) : "0.00"} - ₹${typeof f.maxNAV === "number" ? f.maxNAV.toFixed(2) : "0.00"}`,
  }));
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.type === "user";

  // ✅ USER MESSAGE
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm max-w-[75%] leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  const funds = msg.funds?.length ? formatFunds(msg.funds) : null;
  const isComparison = funds && funds.length >= 2;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">

        {/* Header */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Sparkles size={11} className="text-blue-500 dark:text-blue-400" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Mutual-Funds Sahi Hai
          </span>
        </div>

        {/* 🔥 Summary Box */}
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm 
          bg-gray-100 dark:bg-gray-800/60 
          border border-gray-200 dark:border-gray-700/50 
          text-sm text-gray-800 dark:text-gray-200 
          leading-relaxed whitespace-pre-wrap"
        >
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
            Summary
          </p>
          <p>{msg.text}</p>
        </div>

        {/* 📊 Fund Cards */}
        {funds && funds.length > 0 && (
          <FundCardGrid funds={funds} isComparison={isComparison} />
        )}

      </div>
    </div>
  );
};

export default MessageBubble;