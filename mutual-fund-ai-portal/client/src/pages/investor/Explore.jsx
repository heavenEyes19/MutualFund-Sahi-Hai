import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ArrowRight, TrendingUp, BarChart2, Globe,
  Rocket, CircleDollarSign, Medal, Building2, Building, Home,
  Diamond, Sprout, Trophy, Sparkles, Download, Scale, Calculator,
  HeartPulse, Shield, ArrowUpRight
} from 'lucide-react';
import { getTrendingFunds, getRecommendedFunds } from '../../services/mutualFunds';
import { getPortfolio, getSIPs } from '../../services/portfolio';
import { motion } from 'framer-motion';

// 1. Popular Fund Card
const PopularFundCard = ({ fund, onClick, iconType }) => {
  const configs = [
    { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', Icon: TrendingUp },
    { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', Icon: BarChart2 },
    { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', Icon: Globe },
  ];
  const { bg, text, Icon } = configs[iconType % 3];

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="ui-card p-5 sm:p-6 cursor-pointer flex flex-col h-[220px] group relative overflow-hidden dark:bg-slate-900/50"
    >
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-auto group-hover:rotate-6 transition-transform duration-300 shadow-sm`}>
        <Icon size={20} className={text} strokeWidth={2} />
      </div>
      <div className="relative z-10">
        <h3 className="font-bold text-slate-800 dark:text-white text-[15px] leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {fund.schemeName}
        </h3>
        <div>
          <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl tracking-tighter mb-1">
            {fund.returns3Y ? `+${fund.returns3Y}%` : 'N/A'}
          </p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">3Y · {fund.category || 'Small cap'}</p>
        </div>
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={80} className="text-slate-900 dark:text-white" />
      </div>
    </motion.div>
  );
};

// 2. Theme Chip
const ThemeChip = ({ icon: Icon, title, onClick, color }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.05 }}
    onClick={onClick}
    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center min-w-[100px] cursor-pointer shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all shrink-0 group"
  >
    <div className={`w-12 h-12 rounded-2xl ${color.bg} flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-inner`}>
      <Icon size={20} className={color.text} strokeWidth={2} />
    </div>
    <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
      {title.split(' ').map((w, i) => <React.Fragment key={i}>{w}<br /></React.Fragment>)}
    </span>
  </motion.div>
);

// 3. List Fund Card
const ListFundCard = ({ fund, onClick, isLast, iconType }) => {
  const configs = [
    { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', Icon: Diamond },
    { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', Icon: Sprout },
    { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', Icon: Trophy },
  ];
  const { bg, text, Icon } = configs[iconType % 3];

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-5 sm:p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={18} className={text} strokeWidth={2} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-[14px] sm:text-[15px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{fund.schemeName}</h3>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{fund.category || 'Large cap'} · {fund.risk || 'Very high risk'}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-emerald-600 dark:text-emerald-400 font-black text-[15px] sm:text-[16px]">
          {fund.returns5Y ? `+${fund.returns5Y}%` : fund.returns3Y ? `+${fund.returns3Y}%` : '+22.08%'}
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">5Y CAGR</p>
      </div>
    </div>
  );
};


export default function Explore() {
  const navigate = useNavigate();
  const [data, setData] = useState({ trending: [], recommended: null, portfolio: null, sips: [] });
  const [loading, setLoading] = useState(true);
  const [aiReview, setAiReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('portfolio_review');
      if (saved) setAiReview(JSON.parse(saved));
    } catch { /* ignore corrupt storage */ }
  }, []);

  const handleReviewPortfolio = async (e) => {
    e.stopPropagation();
    setIsReviewing(true);
    try {
      const API = (await import('../../services/api')).default;
      const res = await API.get('/portfolio/review');
      if (res.data) {
        const formatted = {
          ...res.data,
          lastReview: new Date(res.data.lastReview).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setAiReview(formatted);
        localStorage.setItem('portfolio_review', JSON.stringify(formatted));
      }
    } catch (err) {
      console.error('Failed to review portfolio', err);
    } finally {
      setIsReviewing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trend, rec, port, sips] = await Promise.all([
          getTrendingFunds().catch(() => []),
          getRecommendedFunds().catch(() => null),
          getPortfolio().catch(() => null),
          getSIPs().catch(() => [])
        ]);
        setData({ trending: trend || [], recommended: rec, portfolio: port, sips: sips || [] });
      } catch (error) {
        console.error("Failed to load explore data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayTrending = data.trending.length > 0 ? data.trending : [
    { schemeCode: 'mock1', schemeName: 'Bandhan Small Cap Fund', returns3Y: 31.35, category: 'Small cap' },
    { schemeCode: 'mock2', schemeName: 'HDFC Mid Cap Fund', returns3Y: 23.82, category: 'Mid cap' },
    { schemeCode: 'mock3', schemeName: 'Parag Parikh Flexi Cap', returns3Y: 16.71, category: 'Flexi cap' },
  ];

  const displayRecommended = data.recommended?.funds?.length > 0 ? data.recommended.funds : [
    { schemeCode: 'mock4', schemeName: 'Axis Bluechip Fund — Direct', returns5Y: 18.24, category: 'Large cap', risk: 'Very high risk' },
    { schemeCode: 'mock5', schemeName: 'Mirae Asset Emerging Bluechip', returns5Y: 22.08, category: 'Large & mid cap', risk: 'High risk' },
    { schemeCode: 'mock6', schemeName: 'Quant Active Fund — Direct', returns5Y: 28.61, category: 'Multi cap', risk: 'Very high risk' },
  ];

  const totalInvested = data.portfolio?.assets?.reduce((sum, a) => sum + (a.investedValue || 0), 0) || 0;
  const currentValue = data.portfolio?.assets?.reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
  const returns = currentValue - totalInvested;
  const activeSipsCount = data.sips?.filter(s => s.status === 'ACTIVE').length || 0;

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen transition-colors duration-300 font-inter">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-8 space-y-12">

          {/* Greeting */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-500 font-black mb-1">
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
              Build your<br />
              <span className="gradient-text">Financial Legacy.</span>
            </h1>
          </motion.div>

          {/* Popular Funds */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Top Trending Funds</h2>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Based on AI momentum score</p>
              </div>
              <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="group flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">
                View all <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayTrending.slice(0, 3).map((fund, idx) => (
                <PopularFundCard key={fund.schemeCode} fund={fund} iconType={idx} onClick={() => navigate(`/dashboard-area/mutual-funds?scheme=${fund.schemeCode}`)} />
              ))}
            </div>
          </section>

          {/* Browse by theme */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Explore Categories</h2>
                 <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Goal-based collections</p>
               </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
              {[
                { icon: Rocket, title: "High growth", color: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' } },
                { icon: CircleDollarSign, title: "SIP ₹500", color: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' } },
                { icon: Medal, title: "Precious Metals", color: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' } },
                { icon: Building2, title: "Large cap", color: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' } },
                { icon: Building, title: "Mid cap", color: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' } },
                { icon: Home, title: "Small cap", color: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-500 dark:text-rose-400' } },
              ].map(chip => (
                <div key={chip.title} className="snap-start shrink-0">
                  <ThemeChip {...chip} onClick={() => navigate('/dashboard-area/mutual-funds')} />
                </div>
              ))}
            </div>
          </section>

          {/* AI Recommended */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Recommended</h2>
                 <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Optimized for your risk profile</p>
               </div>
            </div>
            <div className="ui-card divide-y dark:bg-slate-900/40 divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {displayRecommended.slice(0, 3).map((fund, idx) => (
                <ListFundCard
                  key={fund.schemeCode}
                  fund={fund}
                  iconType={idx}
                  isLast={idx === 2}
                  onClick={() => navigate(`/dashboard-area/mutual-funds?scheme=${fund.schemeCode}`)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32 self-start">

          {/* Health Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[32px] p-7 overflow-hidden shadow-2xl transition-all hover:scale-[1.01]" 
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[80px] pointer-events-none rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 blur-[60px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <HeartPulse size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">Health Index</h2>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Portfolio AI Pulse</p>
                </div>
              </div>
              <Sparkles size={18} className="text-yellow-300 animate-pulse" />
            </div>

            {aiReview ? (
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/10 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <span className="text-[12px] font-bold text-indigo-100 uppercase tracking-wider">Health Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white leading-none">{aiReview.healthScore}</span>
                    <div className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${aiReview.healthBadge === 'Poor' ? 'bg-rose-500/40 text-rose-100' : aiReview.healthBadge === 'Fair' ? 'bg-amber-500/40 text-amber-100' : 'bg-emerald-500/40 text-emerald-100'}`}>
                      {aiReview.healthBadge}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/10 border border-white/10 rounded-2xl backdrop-blur-sm space-y-3">
                  <div className="flex justify-between text-[11px] font-bold text-indigo-100 uppercase tracking-widest">
                    <span>AI Confidence</span>
                    <span className="text-yellow-200">{aiReview.aiConfidence}%</span>
                  </div>
                  <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${aiReview.aiConfidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-300 rounded-full" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleReviewPortfolio} 
                  disabled={isReviewing} 
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white text-indigo-700 text-sm font-black rounded-[20px] hover:bg-indigo-50 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isReviewing ? <><div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /> Analyzing...</> : <><ArrowUpRight size={16} /> Update AI Analysis</>}
                </button>
              </div>
            ) : (
              <div className="relative z-10 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                  <HeartPulse size={32} className="text-indigo-200" />
                </div>
                <p className="text-sm font-medium text-indigo-100 mb-8 leading-relaxed">Let our AI engine run a deep-dive diagnosis on your portfolio health.</p>
                <button 
                  onClick={handleReviewPortfolio} 
                  disabled={isReviewing} 
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white text-indigo-700 text-sm font-black rounded-[20px] hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                >
                  {isReviewing ? <><div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /> Analyzing...</> : "Run Quick Diagnosis"}
                </button>
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { 
                label: 'Investments', 
                icon: Sprout, 
                value: `₹${currentValue.toLocaleString()}`, 
                sub: `${returns >= 0 ? '+' : ''}₹${returns.toLocaleString()}`,
                subColor: returns >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500',
                path: '/dashboard-area/portfolio'
              },
              { 
                label: 'Active SIPs', 
                icon: TrendingUp, 
                value: activeSipsCount, 
                sub: activeSipsCount > 0 ? 'Optimal' : 'Low Momentum',
                subColor: activeSipsCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400',
                path: '/dashboard-area/sips'
              }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                whileHover={{ y: -4 }}
                onClick={() => navigate(stat.path)}
                className="ui-card p-5 cursor-pointer dark:bg-slate-900/50 group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white truncate">{stat.value}</p>
                <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${stat.subColor}`}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Tools & products */}
          <div className="ui-card p-6 dark:bg-slate-900/50">
            <h2 className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Pro Tools</h2>
            <div className="space-y-2">
              {[
                { Icon: Rocket, label: 'NFO Pulse', sub: 'Live Fund Offers', badge: '5 LIVE', color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
                { Icon: Download, label: 'CAS Sync', sub: 'Import External Funds', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { Icon: Scale, label: 'Fund X-Ray', sub: 'Head-to-Head Comparison', color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                { Icon: Calculator, label: 'Goal Sim', sub: 'Returns Calculator', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
              ].map(({ Icon, label, sub, badge, color }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{label}</p>
                      <p className="text-[10px] font-medium text-slate-400">{sub}</p>
                    </div>
                  </div>
                  {badge ? (
                    <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-1 rounded-lg">{badge}</span>
                  ) : (
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
