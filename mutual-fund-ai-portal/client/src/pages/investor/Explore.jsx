import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, ArrowRight, TrendingUp, Wallet, Coins, Building2 } from 'lucide-react';
import { getTrendingFunds, getRecommendedFunds } from '../../services/mutualFunds';
import { getPortfolio, getSIPs } from '../../services/portfolio';

// Minimalist Card with Pop Colors
const MinimalFundCard = ({ fund, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="w-full border border-[#EAE7DF] dark:border-[#333] bg-white dark:bg-[#161616] rounded-2xl p-6 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] hover:border-[#D1CECB] dark:hover:border-[#444] transition-all flex flex-col h-[180px] group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4A7D69]/10 to-transparent dark:from-[#5FC09C]/10 rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-auto relative z-10">
        <h3 className="font-serif text-[#333] dark:text-[#EEE] text-lg leading-snug line-clamp-2 pr-4 group-hover:text-[#4A7D69] dark:group-hover:text-[#5FC09C] transition-colors">
          {fund.schemeName}
        </h3>
        <div className="w-8 h-8 rounded-full bg-[#FAFAF7] dark:bg-[#111] flex items-center justify-center shrink-0 group-hover:bg-[#4A7D69] group-hover:text-white transition-colors">
          <ArrowUpRight size={14} className="text-slate-400 group-hover:text-white" />
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-4 relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">3Y Return</p>
          <p className="text-[#4A7D69] dark:text-[#5FC09C] font-sans font-semibold text-xl tracking-tight">
            {fund.returns3Y ? `+${fund.returns3Y}%` : 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">AMC</p>
          <p className="text-slate-600 dark:text-slate-400 font-sans text-xs font-medium bg-slate-100 dark:bg-[#222] px-2 py-1 rounded-md">{fund.amc || 'Unknown'}</p>
        </div>
      </div>
    </div>
  );
};

// Minimalist Theme Chip
const ThemeChip = ({ icon: Icon, title, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col gap-3 min-w-[140px] border-b border-[#EAE7DF] dark:border-[#333] pb-4 cursor-pointer group hover:border-[#333] dark:hover:border-[#AAA] transition-colors"
    >
      <Icon strokeWidth={1} className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-[#333] dark:group-hover:text-[#EEE] transition-colors" />
      <span className="font-serif text-sm text-[#555] dark:text-[#CCC] group-hover:text-[#111] dark:group-hover:text-[#FFF] transition-colors">
        {title}
      </span>
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
    { schemeCode: 'mock1', schemeName: 'HDFC Silver ETF FoF Direct', returns3Y: 55.34, amc: 'HDFC' },
    { schemeCode: 'mock2', schemeName: 'Bandhan Small Cap Fund', returns3Y: 31.35, amc: 'Bandhan' },
    { schemeCode: 'mock3', schemeName: 'Parag Parikh Flexi Cap', returns3Y: 16.71, amc: 'PPFAS' },
  ];

  const displayRecommended = data.recommended?.funds?.length > 0 ? data.recommended.funds : [
    { schemeCode: 'mock4', schemeName: 'Groww Nifty Private Bank Index', returns3Y: 18.2, amc: 'Groww' },
    { schemeCode: 'mock5', schemeName: 'SBI Equity Hybrid Fund', returns3Y: 12.4, amc: 'SBI' },
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
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 font-bold mb-2">
          {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
        </p>
        <h1 className="text-4xl font-serif text-[#333] dark:text-[#EEE]">
          What would you like to do?
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        
        {/* LEFT COLUMN: Main Discovery */}
        <div className="lg:col-span-8 space-y-20">
          
          {/* SECTION: Popular Funds */}
          <section>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif text-[#333] dark:text-[#EEE] tracking-tight mb-1">Popular funds</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans tracking-wide">Top performers this quarter</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {displayTrending.slice(0, 4).map(fund => (
                <MinimalFundCard key={fund.schemeCode} fund={fund} onClick={() => navigate(`/dashboard-area/mutual-funds?scheme=${fund.schemeCode}`)} />
              ))}
            </div>

            <div className="mt-8 flex justify-start">
              <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="inline-flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-[#161616] hover:bg-[#F4F2EC] dark:hover:bg-[#222] border border-[#EAE7DF] dark:border-[#333] text-[#333] dark:text-[#EEE] font-serif font-medium rounded-full transition-colors shadow-sm group">
                Browse All Mutual Funds 
                <div className="w-6 h-6 rounded-full bg-[#4A7D69] flex items-center justify-center group-hover:scale-110 transition-transform">
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
            
            <div className="flex gap-8 overflow-x-auto pb-4 custom-scrollbar snap-x">
              <div className="snap-start"><ThemeChip icon={TrendingUp} title="High return" onClick={() => navigate('/dashboard-area/mutual-funds')} /></div>
              <div className="snap-start"><ThemeChip icon={Wallet} title="SIP with ₹100" onClick={() => navigate('/dashboard-area/mutual-funds')} /></div>
              <div className="snap-start"><ThemeChip icon={Coins} title="Gold & Silver" onClick={() => navigate('/dashboard-area/mutual-funds')} /></div>
              <div className="snap-start"><ThemeChip icon={Building2} title="Top Companies" onClick={() => navigate('/dashboard-area/mutual-funds')} /></div>
            </div>
          </section>

          {/* SECTION: Funds by MFSH (AI Recommended) */}
          <section>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif text-[#333] dark:text-[#EEE] tracking-tight mb-1">Funds by MFSH</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans tracking-wide">Handpicked by our advisors</p>
              </div>
              <button onClick={() => navigate('/dashboard-area/ai-advisory')} className="text-[11px] font-sans text-emerald-700/60 dark:text-emerald-400/60 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
                View all <ChevronRight size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {displayRecommended.slice(0, 4).map(fund => (
                <MinimalFundCard key={fund.schemeCode} fund={fund} onClick={() => navigate(`/dashboard-area/mutual-funds?scheme=${fund.schemeCode}`)} />
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Minimalist Stats */}
        <div className="lg:col-span-4 space-y-16 pt-2">
          
          {/* Portfolio Summary */}
          <section>
            <h2 className="text-sm font-serif text-[#333] dark:text-[#EEE] mb-6">Your Investments</h2>
            <div className="border border-[#EAE7DF] dark:border-[#333] bg-white/40 dark:bg-[#1A1A1A]/40 p-6 flex flex-col gap-6">
              {data.portfolio && totalInvested > 0 ? (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Current Value</p>
                    <p className="text-3xl font-serif text-[#333] dark:text-[#EEE]">₹{currentValue.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between border-t border-[#EAE7DF] dark:border-[#333] pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Invested</p>
                      <p className="text-sm font-sans text-slate-600 dark:text-slate-300">₹{totalInvested.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Returns</p>
                      <p className={`text-sm font-sans ${returns >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {returns >= 0 ? '+' : ''}₹{returns.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/dashboard-area/portfolio')} className="w-full mt-2 text-[11px] uppercase tracking-widest font-sans text-center text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-[#FFF] py-3 border border-[#EAE7DF] dark:border-[#444] transition-colors">
                    View Portfolio
                  </button>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm font-serif italic text-slate-400 dark:text-slate-500 mb-4">No active investments yet.</p>
                  <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="w-full text-[11px] uppercase tracking-widest font-sans text-center text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-[#FFF] py-3 border border-[#EAE7DF] dark:border-[#444] transition-colors">
                    Start Investing
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SIP Summary */}
          <section>
            <h2 className="text-sm font-serif text-[#333] dark:text-[#EEE] mb-6">Active SIPs</h2>
            <div className="border border-[#EAE7DF] dark:border-[#333] bg-white/40 dark:bg-[#1A1A1A]/40 p-6 flex flex-col gap-6">
              {activeSipsCount > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-serif text-[#333] dark:text-[#EEE]">{activeSipsCount}</p>
                    <p className="text-xs font-sans text-slate-400 dark:text-slate-500">running SIPs</p>
                  </div>
                  <button onClick={() => navigate('/dashboard-area/sips')} className="w-full text-[11px] uppercase tracking-widest font-sans text-center text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-[#FFF] py-3 border border-[#EAE7DF] dark:border-[#444] transition-colors">
                    Manage SIPs
                  </button>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm font-serif italic text-slate-400 dark:text-slate-500 mb-4">No active SIPs found.</p>
                  <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="w-full text-[11px] uppercase tracking-widest font-sans text-center text-[#555] dark:text-[#AAA] hover:text-[#111] dark:hover:text-[#FFF] py-3 border border-[#EAE7DF] dark:border-[#444] transition-colors">
                    Setup SIP
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
        
      </div>
    </div>
  );
}
