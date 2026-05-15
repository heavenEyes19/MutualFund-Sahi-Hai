import { useState, useRef, useEffect } from "react";
import { 
  Shield, Calendar, ArrowRight, Search, PieChart, TrendingDown, Target, ShieldCheck, HeartPulse, Info, Sparkles, Paperclip, Mic, Loader
} from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../store/useAuthStore";
import KycGuard from "../../components/layout/KycGuard";
import { useKycStatus } from "../../hooks/useKycStatus";

import MessageBubble from "@/components/ai/MessageBubble";

const AIAdvisory = () => {
  const { user } = useAuthStore();
  const { kycStatus, kycRejectionReason, loading: kycLoading } = useKycStatus();
  const [input, setInput] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [messages, setMessages] = useState([{ type: "initial" }]);
  const messagesEndRef = useRef(null);

  // Load last review from localStorage on mount — no Groq call on page load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_review");
      if (saved) {
        setTimeout(() => setReviewData(JSON.parse(saved)), 0);
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e, chipText = null) => {
    if (e) e.preventDefault();
    const query = chipText || input;
    if (!query.trim()) return;

    setInput("");
    
    // Optimistic UI updates
    setMessages((prev) => [...prev, { type: "user", text: query }, { type: "thinking" }]);

    try {
      const res = await API.post("/chatbot", { message: query });
      
      setMessages((prev) => {
        const filtered = prev.filter(m => m.type !== "thinking");
        return [...filtered, {
          type: "ai",
          text: res.data.reply,
          funds: res.data.funds
        }];
      });
    } catch {
      setMessages((prev) => {
        const filtered = prev.filter(m => m.type !== "thinking");
        return [...filtered, {
          type: "ai",
          text: "Something went wrong fetching the AI response. Please try again."
        }];
      });
    }
  };

  const handleReviewPortfolio = async () => {
    setIsReviewing(true);
    try {
      const res = await API.get("/portfolio/review");
      if (res.data) {
        const formatted = {
          ...res.data,
          lastReview: new Date(res.data.lastReview).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        };
        setReviewData(formatted);
        localStorage.setItem("portfolio_review", JSON.stringify(formatted));
      }
    } catch (error) {
      console.error("Failed to review portfolio", error);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <KycGuard kycStatus={kycStatus} kycRejectionReason={kycRejectionReason} loading={kycLoading}>
    <div className="p-4 md:p-6 bg-[#0B1120] h-[calc(100vh-64px)] flex flex-col text-slate-200 font-sans">
      
      {/* TOP SECTION: Header & Subtitle */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center tracking-wide">
          <Sparkles className="mr-3 text-blue-500 fill-blue-500/20" size={24} />
          AI Advisory
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Personalized insights • Smarter decisions • Better financial future</p>
      </div>

      {/* 4 Compact Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Card 1 */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-slate-400 text-xs font-medium mb-3">
            <HeartPulse size={14} className="text-emerald-500 mr-2" />
            Portfolio Health <Info size={12} className="ml-2 text-slate-500 cursor-pointer hover:text-slate-300" />
          </div>
          {reviewData ? (
            <>
              <div className="flex items-baseline mb-1">
                <span className="text-4xl font-bold text-white tracking-tight">{reviewData.healthScore}</span>
                <span className="text-slate-500 text-sm ml-1">/100</span>
                <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded ${reviewData.healthBadge === 'Poor' ? 'text-red-500 bg-red-500/10' : reviewData.healthBadge === 'Fair' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                  {reviewData.healthBadge}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">{reviewData.healthText}</p>
            </>
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-800 rounded w-3/4"></div>
            </div>
          )}
        </div>

        {/* Card 2 */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center text-slate-400 text-xs font-medium mb-3">
            <Shield size={14} className="text-indigo-400 mr-2" />
            Risk Profile <Info size={12} className="ml-2 text-slate-500 cursor-pointer hover:text-slate-300" />
          </div>
          {reviewData ? (
            <>
              <h3 className="text-xl font-bold text-white mb-2">{reviewData.riskProfile}</h3>
              <div className="flex gap-1 mb-auto mt-1">
                <div className={`h-1.5 flex-1 rounded-full ${reviewData.riskProfile === 'Conservative' ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${['Conservative', 'Moderate', 'Aggressive'].includes(reviewData.riskProfile) ? 'bg-yellow-500' : 'bg-slate-700'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${['Moderate', 'Aggressive'].includes(reviewData.riskProfile) ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${['Aggressive'].includes(reviewData.riskProfile) ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                <div className="h-1.5 flex-1 bg-slate-700 rounded-full"></div>
              </div>
            </>
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-slate-800 rounded w-1/2"></div>
              <div className="flex gap-1"><div className="h-1.5 bg-slate-800 flex-1 rounded-full"></div><div className="h-1.5 bg-slate-800 flex-1 rounded-full"></div></div>
            </div>
          )}
          <button className="text-blue-500 text-xs font-medium hover:text-blue-400 flex items-center mt-4">
            View Details <ArrowRight size={12} className="ml-1" />
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-slate-400 text-xs font-medium mb-3">
            <Sparkles size={14} className="text-blue-500 mr-2 fill-blue-500/20" />
            AI Confidence <Info size={12} className="ml-2 text-slate-500 cursor-pointer hover:text-slate-300" />
          </div>
          {reviewData ? (
            <>
              <div className="flex items-baseline mb-1">
                <span className="text-4xl font-bold text-white tracking-tight">{reviewData.aiConfidence}%</span>
                <span className="ml-3 bg-blue-500/10 text-blue-400 text-xs font-medium px-2 py-0.5 rounded">{reviewData.confidenceBadge}</span>
              </div>
              <p className="text-slate-500 text-xs mt-2">{reviewData.confidenceText}</p>
            </>
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-800 rounded w-3/4"></div>
            </div>
          )}
        </div>

        {/* Card 4 */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center text-slate-400 text-xs font-medium mb-2">
            <Calendar size={14} className="text-blue-500 mr-2" />
            Last Portfolio Review
          </div>
          {reviewData ? (
            <>
              <h3 className="text-xl font-bold text-white mb-0.5">
                {new Date(reviewData.lastReview).toDateString() === new Date().toDateString() ? "Just now" : reviewData.lastReview}
              </h3>
              <p className="text-slate-500 text-xs mb-auto">{reviewData.lastReview}</p>
            </>
          ) : (
            <div className="animate-pulse space-y-3 mb-auto">
              <div className="h-6 bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-800 rounded w-1/3"></div>
            </div>
          )}
          <button 
            onClick={handleReviewPortfolio}
            disabled={isReviewing}
            className="text-blue-500 text-xs font-medium hover:text-blue-400 flex items-center mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReviewing ? <Loader size={12} className="animate-spin mr-1" /> : "Review Again"}
            {!isReviewing && <ArrowRight size={12} className="ml-1" />}
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="w-full flex-1 min-h-0 flex">
        
        {/* Main AI Area */}
        <div className="w-full h-full">
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 h-full flex flex-col shadow-sm">
            <h2 className="text-lg font-bold text-white mb-1">How can I help you today?</h2>
            <p className="text-slate-400 text-sm mb-6">Ask anything about mutual funds, your portfolio, or investment strategies.</p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2.5 mb-8">
              {[
                { text: "Analyze my portfolio", color: "text-blue-500", border: "border-blue-900/40", icon: Search },
                { text: "Am I diversified enough?", color: "text-emerald-500", border: "border-emerald-900/40", icon: PieChart },
                { text: "Which fund is underperforming?", color: "text-purple-500", border: "border-purple-900/40", icon: TrendingDown },
                { text: "Suggest SIP allocation", color: "text-orange-500", border: "border-orange-900/40", icon: Target },
                { text: "Best funds for long term", color: "text-green-500", border: "border-green-900/40", icon: ShieldCheck }
              ].map((chip, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(null, chip.text)}
                  className={`flex items-center px-4 py-1.5 rounded-full border ${chip.border} bg-[#0B1120] hover:bg-slate-800/80 transition-colors`}
                >
                  <chip.icon size={12} className={`${chip.color} mr-2`} />
                  <span className="text-slate-300 text-xs">{chip.text}</span>
                </button>
              ))}
            </div>

            {/* AI Message Area */}
            <div className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-5 mb-8 flex-1 overflow-y-auto space-y-6 flex flex-col">
              {messages.map((msg, index) => {
                if (msg.type === "initial") {
                  return (
                    <div key={index} className="flex-1 shrink-0">
                      <div className="flex items-start">
                        <div className="w-7 h-7 rounded-full bg-[#1e293b] flex items-center justify-center mr-3 mt-0.5 shrink-0">
                          <Sparkles size={14} className="text-blue-400 fill-blue-400/20" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-slate-200 text-sm mb-0.5">Hi {user?.name?.split(' ')[0] || 'Investor'}! 👋</h4>
                          </div>
                          <p className="text-slate-400 text-sm mt-1">I'm your AI advisor. Ask me anything about your portfolio or the mutual fund market!</p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (msg.type === "thinking") {
                  return (
                    <div key={index} className="flex justify-start items-center space-x-2 text-slate-400 text-sm">
                      <Loader size={14} className="animate-spin text-blue-500" />
                      <span>AI is thinking...</span>
                    </div>
                  );
                } else {
                  return <MessageBubble key={index} msg={msg} />;
                }
              })}
              {/* Dummy element for scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} className="mt-auto">
              <div className="bg-[#1e293b] border border-slate-700/50 rounded-full px-4 py-2 flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about mutual funds, investments, SIPs..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm placeholder-slate-500 px-2"
                />
                <div className="flex items-center space-x-2 ml-2">
                  <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition-colors"><Paperclip size={16} /></button>
                  <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition-colors"><Mic size={16} /></button>
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors shrink-0 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              <p className="text-center text-slate-500 text-[10px] mt-3">AI can make mistakes. Verify important information.</p>
            </form>

          </div>
        </div>

      </div>
    </div>
    </KycGuard>
  );
};

export default AIAdvisory;