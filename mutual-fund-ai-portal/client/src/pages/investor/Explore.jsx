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

// 1. Popular Fund Card
const PopularFundCard = ({ fund, onClick, iconType }) => {
  let iconBg = 'bg-[#FFF3E9] dark:bg-[#331E12]';
  let iconColor = 'text-[#D26D45] dark:text-[#E88C6A]';
  let IconComponent = TrendingUp;

  if (iconType % 3 === 1) {
    iconBg = 'bg-emerald-50 dark:bg-emerald-500/10';
    iconColor = 'text-emerald-500 dark:text-emerald-400';
    IconComponent = BarChart2;
  } else if (iconType % 3 === 2) {
    iconBg = 'bg-[#F0EDFA] dark:bg-[#201B33]';
    iconColor = 'text-[#6B53A3] dark:text-[#8D76C4]';
    IconComponent = Globe;
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-[24px] p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1.5 hover:border-[#D1CECB] dark:hover:border-[#555] transition-all duration-300 ease-out flex flex-col h-[220px] group"
    >
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-auto group-hover:scale-110 transition-transform duration-300`}>
        <IconComponent size={20} className={iconColor} strokeWidth={2} />
      </div>
      
      <h3 className="font-sans font-medium text-[#222] dark:text-[#EEE] text-[15px] leading-snug mb-4 pr-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300">
        {fund.schemeName}
      </h3>
      
      <div>
        <p className="text-emerald-500 dark:text-emerald-400 font-sans font-semibold text-xl tracking-tight mb-0.5">
          {fund.returns3Y ? `+${fund.returns3Y}%` : 'N/A'}
        </p>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 font-sans group-hover:text-slate-500 transition-colors">
          3Y · {fund.category || 'Small cap'}
        </p>
      </div>
    </div>
  );
};

// 2. Theme Chip Pill
const ThemeChip = ({ icon: Icon, title, onClick, color }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-[24px] p-4 flex flex-col items-center justify-center min-w-[90px] cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-[#D1CECB] dark:hover:border-[#555] transition-all duration-300 ease-out shrink-0 group"
    >
      <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={20} className={color.text} strokeWidth={1.5} />
      </div>
      <span className="font-sans text-[12px] font-medium text-[#555] dark:text-[#CCC] text-center leading-tight group-hover:text-[#111] dark:group-hover:text-[#FFF] transition-colors duration-300">
        {title.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
      </span>
    </div>
  );
};

// 3. List Fund Card (Funds by MFSH)
const ListFundCard = ({ fund, onClick, isLast, iconType }) => {
  let iconBg = 'bg-emerald-50 dark:bg-emerald-500/10';
  let iconColor = 'text-emerald-500 dark:text-emerald-400';
  let IconComponent = Diamond;

  if (iconType % 3 === 1) {
    iconBg = 'bg-[#FFF3E9] dark:bg-[#331E12]';
    iconColor = 'text-[#D26D45] dark:text-[#E88C6A]';
    IconComponent = Sprout;
  } else if (iconType % 3 === 2) {
    iconBg = 'bg-[#F0EDFA] dark:bg-[#201B33]';
    iconColor = 'text-[#6B53A3] dark:text-[#8D76C4]';
    IconComponent = Trophy;
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222] transition-colors duration-300 group ${!isLast ? 'border-b border-[#EAE7DF] dark:border-[#333]' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent size={20} className={iconColor} strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-sans font-medium text-[#222] dark:text-[#EEE] text-[15px] group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300">
            {fund.schemeName}
          </h3>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">
            {fund.category || 'Large cap'} · {fund.risk || 'Very high risk'}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-emerald-500 dark:text-emerald-400 font-sans font-semibold text-[15px]">
          {fund.returns5Y ? `+${fund.returns5Y}%` : fund.returns3Y ? `+${fund.returns3Y}%` : '+22.08%'}
        </p>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">
          {fund.returns5Y ? '5Y' : '5Y'}
        </p>
      </div>
    </div>
  );
};


export default function Explore() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    trending: [],
    recommended: null,
    portfolio: null,
    sips: []
  });
  const [loading, setLoading] = useState(true);
  const [aiReview, setAiReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Load last AI portfolio review from localStorage (shared with AIAdvisory page)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('portfolio_review');
      if (saved) setAiReview(JSON.parse(saved));
    } catch { /* ignore corrupt storage */ }
  }, []);

  // Trigger a fresh portfolio review
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

  // Fallbacks if backend is slow/empty
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

  // Portfolio calculations
  const totalInvested = data.portfolio?.assets?.reduce((sum, a) => sum + (a.investedValue || 0), 0) || 0;
  const currentValue = data.portfolio?.assets?.reduce((sum, a) => sum + (a.currentValue || 0), 0) || 0;
  const returns = currentValue - totalInvested;
  
  // SIP calculations
  const activeSipsCount = data.sips?.filter(s => s.status === 'ACTIVE').length || 0;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#FAFAF7] dark:bg-[#111111]">
        <div className="w-8 h-8 border-[1px] border-slate-300 dark:border-slate-700 border-t-slate-800 dark:border-t-slate-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#FAFAF7] dark:bg-[#111111] overflow-y-auto custom-scrollbar text-[#333] dark:text-[#EAEAEA] pb-32 pt-8">
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pt-2">

        {/* LEFT COLUMN: Main Discovery */}
        <div className="lg:col-span-8 space-y-12">

          {/* Greeting heading */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 font-bold mb-2">
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
            </p>
            <h1 className="text-4xl font-serif text-[#333] dark:text-[#EEE] leading-tight">
              What would you like to<br />
              <span className="italic text-emerald-600 dark:text-emerald-400">invest in today?</span>
            </h1>
          </div>
          
          {/* SECTION: Popular Funds */}
          <section>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif text-[#333] dark:text-[#EEE] tracking-tight mb-1">Popular funds</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans tracking-wide">Top performers this quarter</p>
              </div>
              <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="text-[13px] font-sans font-medium text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
                See all <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayTrending.slice(0, 3).map((fund, idx) => (
                <PopularFundCard key={fund.schemeCode} fund={fund} iconType={idx} onClick={() => navigate(`/dashboard-area/mutual-funds?scheme=${fund.schemeCode}`)} />
              ))}
            </div>
            
            <div className="mt-8 flex justify-start">
              <button 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
                className="inline-flex items-center gap-3 px-7 py-4 bg-[#C96A2E] hover:bg-[#B35D28] text-white border-none hover:shadow-lg hover:shadow-orange-900/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 font-serif font-medium rounded-full transition-all duration-300 ease-out shadow-md group"
              >
                Browse All Mutual Funds 
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:translate-x-0.5 transition-transform duration-300">
                  <ArrowRight size={14} className="text-white" />
                </div>
              </button>
            </div>
          </section>

          {/* SECTION: Browse by theme */}
          <section>
            <div className="mb-8">
              <h2 className="text-2xl font-serif text-[#333] dark:text-[#EEE] tracking-tight mb-1">Browse by theme</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-sans tracking-wide">Curated collections for every goal</p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              <ThemeChip 
                icon={Rocket} title="High return" 
                color={{bg: 'bg-[#FFF3E9] dark:bg-[#331E12]', text: 'text-[#D26D45] dark:text-[#E88C6A]'}} 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
              />
              <ThemeChip 
                icon={CircleDollarSign} title="SIP ₹100" 
                color={{bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400'}} 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
              />
              <ThemeChip 
                icon={Medal} title="Gold & silver" 
                color={{bg: 'bg-[#FDF6E3] dark:bg-[#332A12]', text: 'text-[#B8860B] dark:text-[#D4AF37]'}} 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
              />
              <ThemeChip 
                icon={Building2} title="Large cap" 
                color={{bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400'}} 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
              />
              <ThemeChip 
                icon={Building} title="Mid cap" 
                color={{bg: 'bg-[#FFF3E9] dark:bg-[#331E12]', text: 'text-[#D26D45] dark:text-[#E88C6A]'}} 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
              />
              <ThemeChip 
                icon={Home} title="Small cap" 
                color={{bg: 'bg-[#F0EDFA] dark:bg-[#201B33]', text: 'text-[#6B53A3] dark:text-[#8D76C4]'}} 
                onClick={() => navigate('/dashboard-area/mutual-funds')} 
              />
            </div>
          </section>

          {/* SECTION: Funds by MFSH */}
          <section>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif text-[#333] dark:text-[#EEE] tracking-tight mb-1">Funds by MFSH</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans tracking-wide">Handpicked by our advisors</p>
              </div>
              <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="text-[13px] font-sans font-medium text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-[24px] overflow-hidden shadow-sm">
              {displayRecommended.slice(0, 3).map((fund, idx) => (
                <ListFundCard 
                  key={fund.schemeCode} 
                  fund={fund} 
                  iconType={idx}
                  isLast={idx === displayRecommended.slice(0, 3).length - 1}
                  onClick={() => navigate(`/dashboard-area/mutual-funds?scheme=${fund.schemeCode}`)} 
                />
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Sticky full-height stats */}
        <div className="lg:col-span-4 space-y-8 pt-2 lg:sticky lg:top-4 self-start">

          {/* Health Card */}
          <section>
            <div
              className="relative rounded-[24px] p-7 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl group"
              style={{ background: 'linear-gradient(145deg, #8B3A1A 0%, #C96A2E 45%, #D4854A 100%)' }}
            >
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-amber-300/15 blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 right-4 w-16 h-16 rounded-full bg-orange-200/10 blur-xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[16px] bg-white/15 border border-white/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <HeartPulse size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-serif font-bold text-white leading-tight">Health Card</h2>
                    <p className="text-[11px] text-orange-200/80 font-sans mt-0.5 tracking-wide">AI Portfolio Diagnosis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                  <ArrowUpRight size={14} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                </div>
              </div>

              {aiReview ? (
                <div className="space-y-3.5 relative z-10">

                  {/* Health Score */}
                  <div className="flex items-center justify-between p-4 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <HeartPulse size={16} className="text-orange-200" />
                      <span className="text-[13px] font-sans text-orange-100">Health score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[26px] font-serif font-bold text-white leading-none">{aiReview.healthScore}</span>
                      <span className="text-[12px] text-orange-300">/100</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        aiReview.healthBadge === 'Poor' ? 'text-rose-200 bg-rose-500/30' :
                        aiReview.healthBadge === 'Fair' ? 'text-amber-100 bg-amber-500/30' :
                                                          'text-green-200 bg-green-500/30'
                      }`}>{aiReview.healthBadge}</span>
                    </div>
                  </div>

                  {/* Risk Profile */}
                  <div className="flex items-center justify-between p-4 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-amber-200" />
                      <span className="text-[13px] font-sans text-orange-100">Risk profile</span>
                    </div>
                    <span className="text-[15px] font-sans font-bold text-white">{aiReview.riskProfile}</span>
                  </div>

                  {/* AI Confidence */}
                  <div className="p-4 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[12px] font-sans text-orange-100">AI confidence</span>
                      <span className="text-[13px] font-sans font-bold text-yellow-200">{aiReview.aiConfidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-300 to-amber-200 rounded-full transition-all duration-700"
                        style={{ width: `${aiReview.aiConfidence || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer: last reviewed + review again */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-orange-200/70 font-sans">Reviewed: {aiReview.lastReview}</p>
                    <button
                      onClick={handleReviewPortfolio}
                      disabled={isReviewing}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-[12px] font-sans font-medium rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isReviewing ? (
                        <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Reviewing...</>
                      ) : (
                        <><ArrowUpRight size={12} /> Review Again</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 space-y-5">
                  {/* Empty state illustration */}
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                      <HeartPulse size={28} className="text-orange-200" />
                    </div>
                    <p className="font-sans text-[14px] text-orange-100 leading-relaxed">
                      No health review yet.<br/>Run a quick AI diagnosis to see your portfolio score, risk level, and personalized advice.
                    </p>
                  </div>
                  <button
                    onClick={handleReviewPortfolio}
                    disabled={isReviewing}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#8B3A1A] font-sans text-[14px] font-bold rounded-2xl hover:bg-orange-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isReviewing ? (
                      <><div className="w-4 h-4 border-2 border-orange-300 border-t-[#8B3A1A] rounded-full animate-spin" /> Analysing your portfolio...</>
                    ) : (
                      <><HeartPulse size={16} /> Run Health Check</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
          
          {/* Quick Stats: Portfolio & SIPs */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Investments Card */}
            <div 
              onClick={() => navigate('/dashboard-area/portfolio')}
              className="bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-[24px] p-5 cursor-pointer hover:shadow-sm transition-all group flex flex-col justify-between h-[160px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F2EFE8] dark:bg-[#2A2823] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sprout size={18} className="text-[#8B7355] dark:text-[#AA8D66]" />
                </div>
                <h3 className="font-sans font-semibold text-[#222] dark:text-[#EEE] text-[14px]">Investments</h3>
              </div>
              
              {data.portfolio && totalInvested > 0 ? (
                <div>
                  <p className="text-2xl font-serif text-[#333] dark:text-[#EEE] mb-1">₹{currentValue.toLocaleString()}</p>
                  <p className={`text-[12px] font-sans font-medium ${returns >= 0 ? 'text-emerald-500' : 'text-rose-600 dark:text-rose-400'}`}>
                    {returns >= 0 ? '+' : ''}₹{returns.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-serif text-[#333] dark:text-[#EEE] mb-1">₹0</p>
                  <p className="text-[12px] font-sans text-slate-400 dark:text-slate-500">Not started yet</p>
                </div>
              )}
            </div>

            {/* SIPs Card */}
            <div 
              onClick={() => navigate('/dashboard-area/sips')}
              className="bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-[24px] p-5 cursor-pointer hover:shadow-sm transition-all group flex flex-col justify-between h-[160px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp size={18} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="font-sans font-semibold text-[#222] dark:text-[#EEE] text-[14px]">Active SIPs</h3>
              </div>
              
              {activeSipsCount > 0 ? (
                <div>
                  <p className="text-2xl font-serif text-[#333] dark:text-[#EEE] mb-1">{activeSipsCount}</p>
                  <p className="text-[12px] font-sans text-emerald-500 dark:text-emerald-400 font-medium">Running smoothly</p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-serif text-[#333] dark:text-[#EEE] mb-1">0</p>
                  <p className="text-[12px] font-sans text-slate-400 dark:text-slate-500">No active SIPs</p>
                </div>
              )}
            </div>

          </div>

          {/* Tools & products */}
          <section>
            <div className="bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-[24px] p-6 shadow-sm">
              <h2 className="text-[17px] font-sans font-semibold text-[#222] dark:text-[#EEE] mb-4">Tools & products</h2>
              
              <div className="flex flex-col">
                {/* Item 1 */}
                <div className="flex items-center justify-between py-4 border-b border-[#EAE7DF] dark:border-[#333] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222] transition-colors duration-300 group -mx-6 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[14px] bg-[#FFF3E9] dark:bg-[#331E12] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Rocket size={18} className="text-[#D26D45] dark:text-[#E88C6A]" />
                    </div>
                    <div>
                      <h3 className="font-sans font-medium text-[#222] dark:text-[#EEE] text-[15px] group-hover:text-[#D26D45] dark:group-hover:text-[#E88C6A] transition-colors duration-300">NFO live</h3>
                      <p className="text-[13px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">New fund offers</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-[#FFF0E5] dark:bg-[#3A1D10] text-[#9A3B22] dark:text-[#D46B47] text-[11px] font-bold rounded-md tracking-wide group-hover:scale-105 transition-transform duration-300">
                    5 open
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between py-4 border-b border-[#EAE7DF] dark:border-[#333] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222] transition-colors duration-300 group -mx-6 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[14px] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Download size={18} className="text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-sans font-medium text-[#222] dark:text-[#EEE] text-[15px] group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300">Import funds</h3>
                      <p className="text-[13px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">From any platform</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-slate-500 transition-all duration-300" />
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between py-4 border-b border-[#EAE7DF] dark:border-[#333] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222] transition-colors duration-300 group -mx-6 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[14px] bg-[#F0EDFA] dark:bg-[#201B33] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Scale size={18} className="text-[#6B53A3] dark:text-[#8D76C4]" />
                    </div>
                    <div>
                      <h3 className="font-sans font-medium text-[#222] dark:text-[#EEE] text-[15px] group-hover:text-[#6B53A3] dark:group-hover:text-[#8D76C4] transition-colors duration-300">Compare funds</h3>
                      <p className="text-[13px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">Side-by-side</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-slate-500 transition-all duration-300" />
                </div>

                {/* Item 4 */}
                <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222] transition-colors duration-300 group -mx-6 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[14px] bg-[#F2EFE8] dark:bg-[#332D24] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Calculator size={18} className="text-[#8B7355] dark:text-[#AA8D66]" />
                    </div>
                    <div>
                      <h3 className="font-sans font-medium text-[#222] dark:text-[#EEE] text-[15px] group-hover:text-[#8B7355] dark:group-hover:text-[#AA8D66] transition-colors duration-300">SIP calculator</h3>
                      <p className="text-[13px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">Plan your returns</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-slate-500 transition-all duration-300" />
                </div>
              </div>
            </div>
          </section>

        </div>
        
      </div>
    </div>
  );
}
