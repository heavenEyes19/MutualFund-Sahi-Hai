import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, PieChart, Calendar, Shield, AlertCircle, ChevronDown, ChevronUp, Info, Check } from "lucide-react";
import FundCardGrid from "./FundCardGrid";

const formatFunds = (funds) => {
  if (!Array.isArray(funds)) return [];
  return funds.filter((f) => {
    const nav = Number.parseFloat(f?.nav);
    return Number.isFinite(nav) && nav > 0;
  }).map((f) => ({
    name: f.name || "Unknown Fund",
    nav: f.nav ? `₹${f.nav}` : "N/A",
    change: typeof f.change90 === "number" ? f.change90 : 0,
    risk: "Medium",
    description: `Range ₹${typeof f.minNAV === "number" ? f.minNAV.toFixed(2) : "0.00"} - ₹${typeof f.maxNAV === "number" ? f.maxNAV.toFixed(2) : "0.00"}`,
  }));
};

const getColorClasses = (color, type = "text") => {
  const map = {
    emerald: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    red:     { text: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/20" },
    amber:   { text: "text-amber-500",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
    orange:  { text: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
    blue:    { text: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  };
  const fallback = { text: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" };
  return map[color]?.[type] ?? fallback[type];
};

const IconMap = { TrendingUp, TrendingDown, PieChart, Calendar, Shield, AlertCircle };

/**
 * Normalise whatever arrives as msg.text into a safe data object.
 * Handles: plain strings, null, undefined, partial objects, wrong field types.
 */
const normaliseData = (raw) => {
  // Plain string → wrap it as simpleWords
  if (typeof raw === "string") {
    return {
      contextLabel: "AI Advisor",
      contextUsed: [],
      verdict: null,
      insights: [],
      simpleWords: raw,
      detailedAnalysis: "",
    };
  }

  // Not an object at all → empty safe object
  if (!raw || typeof raw !== "object") {
    return {
      contextLabel: "AI Advisor",
      contextUsed: [],
      verdict: null,
      insights: [],
      simpleWords: "",
      detailedAnalysis: "",
    };
  }

  // Coerce every field to the right type
  return {
    contextLabel:    typeof raw.contextLabel === "string" ? raw.contextLabel : "AI Advisor",
    contextUsed:     Array.isArray(raw.contextUsed)  ? raw.contextUsed  : [],
    verdict:         raw.verdict && typeof raw.verdict === "object" ? raw.verdict : null,
    insights:        Array.isArray(raw.insights)      ? raw.insights      : [],
    simpleWords:     typeof raw.simpleWords === "string"     ? raw.simpleWords     : "",
    detailedAnalysis: typeof raw.detailedAnalysis === "string" ? raw.detailedAnalysis : "",
  };
};

const MessageBubble = ({ msg }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = msg?.type === "user";

  // ✅ USER MESSAGE
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm max-w-[75%] leading-relaxed shadow-sm">
          {msg.text ?? ""}
        </div>
      </div>
    );
  }

  const funds = Array.isArray(msg?.funds) ? formatFunds(msg.funds) : [];
  const isComparison = funds.length >= 2;
  const data = normaliseData(msg?.text);

  const hasExpandable =
    data.detailedAnalysis.length > 0 || data.insights.length > 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] w-full space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Sparkles size={11} className="text-blue-500" />
          </div>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            {data.contextLabel}
          </span>
          <span className="text-[10px] text-slate-600 ml-auto">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="space-y-4">
          {/* Context Used */}
          {data.contextUsed.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-2 mt-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold w-full block mb-0.5">
                Context Analyzed:
              </span>
              {data.contextUsed.map((ctx, idx) => (
                <div key={idx} className="flex items-center text-[10px] text-slate-400">
                  <Check size={10} className="text-emerald-500 mr-1" />
                  {String(ctx)}
                </div>
              ))}
            </div>
          )}

          {/* Verdict Card */}
          {data.verdict && (
            <div className={`p-4 rounded-xl border ${getColorClasses(data.verdict.color, "bg")} ${getColorClasses(data.verdict.color, "border")}`}>
              <div className="flex items-center mb-1.5">
                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/40 ${getColorClasses(data.verdict.color, "text")}`}>
                  {data.verdict.status ?? "Notice"}
                </div>
              </div>
              <p className="text-sm text-slate-200 font-medium">
                {data.verdict.conclusion ?? ""}
              </p>
            </div>
          )}

          {/* In Simple Words */}
          {data.simpleWords.length > 0 && (
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <p className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                In Simple Words
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{data.simpleWords}</p>
            </div>
          )}

          {/* Expandable: Detailed Analysis + Insight Cards */}
          {hasExpandable && (
            <div>
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="flex items-center text-[11px] font-medium text-slate-400 hover:text-blue-400 transition-colors"
              >
                {isExpanded
                  ? <ChevronUp size={14} className="mr-1" />
                  : <ChevronDown size={14} className="mr-1" />}
                {isExpanded ? "Hide Details" : "View Detailed Analysis"}
              </button>

              {isExpanded && (
                <div className="mt-3 p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-inner space-y-4">
                  {/* Detailed text */}
                  {data.detailedAnalysis.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Detailed Analysis
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {data.detailedAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Insight Cards */}
                  {data.insights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Key Insights
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.insights.map((insight, idx) => {
                          if (!insight || typeof insight !== "object") return null;
                          const Icon = IconMap[insight.iconType] ?? Info;
                          return (
                            <div
                              key={idx}
                              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 shadow-sm hover:bg-slate-800/80 transition-colors"
                            >
                              <div className="flex items-center mb-1.5">
                                <Icon size={14} className={`${getColorClasses(insight.color, "text")} mr-2`} />
                                <span className="text-xs font-semibold text-slate-200">
                                  {String(insight.title ?? "")}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {String(insight.description ?? "")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fund Cards */}
        {funds.length > 0 && (
          <div className="mt-4">
            <FundCardGrid funds={funds} isComparison={isComparison} />
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageBubble;
