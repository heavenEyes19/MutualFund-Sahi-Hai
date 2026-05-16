import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ArrowRight, Loader, PieChart, TrendingDown, Target, ShieldCheck, Search, ChevronDown, ChevronUp, Check, Maximize2, Minimize2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import API from '../../services/api';

// Rotating teaser messages
const TEASER_MESSAGES = [
  "Let me guide your investing journey ✨",
  "How's your portfolio doing today? 📈",
  "Ask me about SIPs & mutual funds",
  "I can help you diversify smarter",
  "Get AI-powered fund suggestions",
];

// Suggestion chips
const CHIPS = [
  { text: 'Analyze my portfolio', icon: Search, color: 'text-emerald-500' },
  { text: 'Am I diversified?', icon: PieChart, color: 'text-indigo-400' },
  { text: 'Underperforming funds?', icon: TrendingDown, color: 'text-rose-400' },
  { text: 'Suggest SIP allocation', icon: Target, color: 'text-amber-500' },
  { text: 'Best funds long term', icon: ShieldCheck, color: 'text-emerald-500' },
];

/** Normalise AI response text into a safe data object (same as MessageBubble) */
const normaliseData = (raw) => {
  if (typeof raw === 'string') return { simpleWords: raw, verdict: null, insights: [], detailedAnalysis: '', contextUsed: [] };
  if (!raw || typeof raw !== 'object') return { simpleWords: '', verdict: null, insights: [], detailedAnalysis: '', contextUsed: [] };
  return {
    contextUsed:      Array.isArray(raw.contextUsed) ? raw.contextUsed : [],
    verdict:          raw.verdict && typeof raw.verdict === 'object' ? raw.verdict : null,
    insights:         Array.isArray(raw.insights) ? raw.insights : [],
    simpleWords:      typeof raw.simpleWords === 'string' ? raw.simpleWords : '',
    detailedAnalysis: typeof raw.detailedAnalysis === 'string' ? raw.detailedAnalysis : '',
  };
};

/** A compact, theme-matched message bubble for the widget */
const WidgetMessage = ({ msg, isDetailedView }) => {
  const [expanded, setExpanded] = useState(false);
  const isUser = msg.type === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-emerald-500 text-white text-[13px] rounded-[18px] rounded-tr-[4px] px-4 py-2.5 max-w-[80%] leading-relaxed shadow-sm">
          {msg.text}
        </div>
      </div>
    );
  }

  const data = normaliseData(msg.text);
  const hasMore = data.detailedAnalysis.length > 0 || data.insights.length > 0;
  const verdictColor = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', badge: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20' },
    red:     { bg: 'bg-rose-50 dark:bg-rose-500/10',       border: 'border-rose-200 dark:border-rose-500/20',       badge: 'text-rose-600 bg-rose-100 dark:bg-rose-500/20' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/20',     badge: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10',       border: 'border-blue-200 dark:border-blue-500/20',       badge: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20' },
  };
  const vc = verdictColor[data.verdict?.color] || verdictColor.blue;

  return (
    <div className="flex justify-start gap-2.5">
      <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={11} className="text-emerald-500" />
      </div>
      <div className="max-w-[85%] space-y-2.5">

        {/* Context Used */}
        {data.contextUsed.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {data.contextUsed.map((ctx, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <Check size={9} className="text-emerald-500" />{String(ctx)}
              </span>
            ))}
          </div>
        )}

        {/* Verdict */}
        {data.verdict && (
          <div className={`p-3 rounded-2xl border ${vc.bg} ${vc.border}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${vc.badge}`}>
              {data.verdict.status ?? 'Notice'}
            </span>
            <p className="text-[13px] text-[#222] dark:text-[#DDD] font-medium mt-2 leading-relaxed">
              {data.verdict.conclusion ?? ''}
            </p>
          </div>
        )}

        {/* Simple Words */}
        {data.simpleWords.length > 0 && (
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#EAE7DF] dark:border-[#333] rounded-2xl px-4 py-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400 rounded-full" />
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 ml-1">In simple words</p>
            <p className="text-[13px] text-[#333] dark:text-[#CCC] leading-relaxed ml-1">{data.simpleWords}</p>
          </div>
        )}

        {/* Expandable details */}
        {hasMore && isDetailedView && (
          <div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-500 hover:text-emerald-600 transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide details' : 'View detailed analysis'}
            </button>
            {expanded && data.detailedAnalysis.length > 0 && (
              <div className="mt-2 bg-[#FAFAF7] dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-2xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Detailed Analysis</p>
                <p className="text-[12px] text-[#444] dark:text-[#BBB] leading-relaxed whitespace-pre-wrap">{data.detailedAnalysis}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatWidget = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [teaserIdx, setTeaserIdx] = useState(0);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ type: 'initial' }]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Teaser cycling
  useEffect(() => {
    if (!user || user.role !== 'investor' || isOpen) return;
    const showTimer = setTimeout(() => setTeaserVisible(true), 1800);
    const cycleTimer = setInterval(() => {
      setTeaserVisible(false);
      setTimeout(() => {
        setTeaserIdx(prev => (prev + 1) % TEASER_MESSAGES.length);
        setTeaserVisible(true);
      }, 350);
    }, 5000);
    return () => { clearTimeout(showTimer); clearInterval(cycleTimer); };
  }, [user, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  if (!user || user.role !== 'investor') return null;

  const handleOpen = () => { setIsOpen(true); setShowTeaser(false); };

  const handleSend = async (e, chipText = null) => {
    if (e) e.preventDefault();
    const query = chipText || input;
    if (!query.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { type: 'user', text: query }, { type: 'thinking' }]);
    try {
      const res = await API.post('/chatbot', { message: query, detailed: isExpanded });
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'thinking');
        return [...filtered, { type: 'ai', text: res.data.reply, funds: res.data.funds }];
      });
    } catch {
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'thinking');
        return [...filtered, { type: 'ai', text: 'Something went wrong. Please try again.' }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ══ EXPANDED: Full centered modal with glass backdrop ══ */}
      {isExpanded && isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-[1000px] h-[82vh] max-h-[700px] flex flex-col rounded-[28px] overflow-hidden shadow-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#111]/85 backdrop-blur-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/60 dark:bg-[#1A1A1A]/70 backdrop-blur-md border-b border-white/50 dark:border-[#2A2A2A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                  <Sparkles size={17} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-[#111] dark:text-[#EEE] font-semibold font-sans text-[15px] leading-tight">MFSH AI Advisor</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-slate-400 font-sans">Detailed mode · Expanded view · Powered by Groq</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-medium flex items-center gap-1.5">
                    <Sparkles size={10} /> Detailed analysis on
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  title="Compact view"
                  className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-[#2A2A2A] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all duration-200 group"
                >
                  <Minimize2 size={14} className="group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                  className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-[#2A2A2A] hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all duration-200"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Suggestion Chips */}
            <div className="px-5 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0 bg-[#FAFAF7]/60 dark:bg-[#111]/60 backdrop-blur-sm">
              {CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(null, chip.text)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/80 dark:border-[#333] bg-white/70 dark:bg-[#1A1A1A]/60 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 text-[12px] font-medium text-[#444] dark:text-[#BBB] shrink-0 transition-all duration-200 hover:scale-[1.02] shadow-sm backdrop-blur-sm"
                >
                  <chip.icon size={12} className={chip.color} />
                  {chip.text}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
              {messages.map((msg, idx) => {
                if (msg.type === 'initial') {
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={12} className="text-emerald-500" />
                      </div>
                      <div className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/70 dark:border-[#333] rounded-[20px] rounded-tl-[4px] px-5 py-3.5 shadow-sm">
                        <p className="text-[14px] font-semibold font-sans text-[#222] dark:text-[#EEE] mb-1">Hi {user?.name?.split(' ')[0] || 'Investor'}! 👋</p>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">I'm your AI advisor in detailed mode. Ask me anything and I'll give you a comprehensive analysis of your portfolio, SIPs, and mutual fund strategy.</p>
                      </div>
                    </div>
                  );
                }
                if (msg.type === 'thinking') {
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Loader size={12} className="text-emerald-500 animate-spin" />
                      </div>
                      <div className="flex gap-1.5 px-5 py-3.5 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/70 dark:border-[#333] rounded-[20px] rounded-tl-[4px] shadow-sm">
                        <span className="w-2 h-2 bg-emerald-300 dark:bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-300 dark:bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-emerald-300 dark:bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  );
                }
                return <WidgetMessage key={idx} msg={msg} isDetailedView={true} />;
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-white/60 dark:bg-[#1A1A1A]/70 backdrop-blur-md border-t border-white/50 dark:border-[#2A2A2A] shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a detailed question about funds, SIPs, portfolio strategy..."
                  className="flex-1 bg-white/60 dark:bg-[#111]/60 backdrop-blur-sm border border-[#E0DDD6]/80 dark:border-[#333] text-[#222] dark:text-[#DDD] placeholder-slate-400 font-sans text-[13px] rounded-2xl px-5 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 shadow-sm"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="text-center text-slate-400 dark:text-slate-600 text-[10px] mt-2 font-sans">AI can make mistakes. Always verify before investing.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ COMPACT: Bottom-right popup ══ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">

        {/* Compact Chat Window */}
        <div className={`transition-all duration-500 ease-out origin-bottom-right ${
          isOpen && !isExpanded ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}>
          <div className="w-[380px] flex flex-col rounded-[28px] overflow-hidden shadow-2xl border border-white/60 dark:border-white/10 bg-white/85 dark:bg-[#111]/90 backdrop-blur-xl h-[560px] max-h-[calc(100vh-240px)]">

            {/* Compact Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white/70 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-white/50 dark:border-[#2A2A2A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-[#111] dark:text-[#EEE] font-semibold font-sans text-[14px] leading-tight">MFSH AI Advisor</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-sans">Online · Compact mode</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsExpanded(true)}
                  title="Expand to full view"
                  className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-[#2A2A2A] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all duration-200 group"
                >
                  <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-[#2A2A2A] hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all duration-200"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Compact Chips */}
            <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0 bg-[#FAFAF7]/60 dark:bg-transparent backdrop-blur-sm">
              {CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(null, chip.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAE7DF]/80 dark:border-[#333] bg-white/70 dark:bg-[#1A1A1A]/60 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-[11px] font-medium text-[#444] dark:text-[#BBB] shrink-0 transition-all duration-200 hover:scale-[1.03] shadow-sm"
                >
                  <chip.icon size={11} className={chip.color} />
                  {chip.text}
                </button>
              ))}
            </div>

            {/* Compact Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => {
                if (msg.type === 'initial') {
                  return (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={11} className="text-emerald-500" />
                      </div>
                      <div className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/70 dark:border-[#333] rounded-[18px] rounded-tl-[4px] px-4 py-3 max-w-[85%] shadow-sm">
                        <p className="text-[13px] font-semibold font-sans text-[#222] dark:text-[#EEE] mb-0.5">Hi {user?.name?.split(' ')[0] || 'Investor'}! 👋</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">I'm your AI advisor. Ask me anything about your portfolio, SIPs, or mutual funds!</p>
                      </div>
                    </div>
                  );
                }
                if (msg.type === 'thinking') {
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Loader size={11} className="text-emerald-500 animate-spin" />
                      </div>
                      <div className="flex gap-1.5 px-4 py-3 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/70 dark:border-[#333] rounded-[18px] rounded-tl-[4px] shadow-sm">
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  );
                }
                return <WidgetMessage key={idx} msg={msg} isDetailedView={false} />;
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Compact Input */}
            <div className="px-4 py-3 bg-white/70 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-t border-white/50 dark:border-[#2A2A2A] shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about funds, SIPs, portfolio..."
                  className="flex-1 bg-[#F4F2EC]/80 dark:bg-[#111]/60 backdrop-blur-sm border border-[#E0DDD6]/80 dark:border-[#333] text-[#222] dark:text-[#DDD] placeholder-slate-400 font-sans text-[13px] rounded-xl px-4 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 shadow-sm"
                >
                  <ArrowRight size={15} />
                </button>
              </form>
              <p className="text-center text-slate-400 dark:text-slate-600 text-[10px] mt-2 font-sans">AI can make mistakes. Always verify before investing.</p>
            </div>
          </div>
        </div>

        {/* Teaser Bubble */}
        {showTeaser && !isOpen && (
          <div className={`pointer-events-auto transition-all duration-400 ease-out ${teaserVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'}`}>
            <div
              onClick={handleOpen}
              className="bg-white/85 dark:bg-[#1A1A1A]/90 backdrop-blur-md border border-white/60 dark:border-[#333] rounded-2xl rounded-br-[6px] px-4 py-2.5 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 max-w-[220px] flex items-center gap-2 group"
            >
              <Sparkles size={12} className="text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
              <p className="text-[12px] font-medium text-[#333] dark:text-[#DDD] font-sans leading-snug">
                {TEASER_MESSAGES[teaserIdx]}
              </p>
            </div>
            <div className="flex justify-end pr-4 -mt-[1px]">
              <div className="w-2.5 h-2.5 bg-white/85 dark:bg-[#1A1A1A]/90 border-r border-b border-white/60 dark:border-[#333] rotate-45" />
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={isOpen ? () => { setIsOpen(false); setIsExpanded(false); } : handleOpen}
          className={`pointer-events-auto relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ease-out ${
            isOpen
              ? 'bg-white/80 dark:bg-[#2A2A2A]/80 backdrop-blur-md border border-white/60 dark:border-[#444] hover:bg-white dark:hover:bg-[#333]'
              : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-110 hover:shadow-emerald-400/40 hover:shadow-2xl'
          }`}
        >
          {!isOpen && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />}
          {isOpen
            ? <X size={20} className="text-[#555] dark:text-[#AAA]" />
            : <Sparkles size={22} className="text-white" />
          }
        </button>

      </div>
    </>
  );
};

export default ChatWidget;

