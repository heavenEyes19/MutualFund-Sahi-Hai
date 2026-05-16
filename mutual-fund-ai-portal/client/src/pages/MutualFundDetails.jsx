import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, ShoppingCart, X, Sparkles, Activity, PieChart as PieChartIcon, Calendar, ArrowLeft, Archive, Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import { getMutualFundDetails, searchMutualFunds } from "../services/mutualFunds";
import { getPortfolio, sellFund, createSIP } from "../services/portfolio";
import API from "../services/api";
import { useKycStatus } from "../hooks/useKycStatus";
import useDarkMode from "../hooks/useDarkMode";
import useCartStore from "../store/useCartStore";
import useNotificationStore from "../store/useNotificationStore";
import MpinModal from "../components/wallet/MpinModal";

const parseNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatNavDate = (value) => {
  if (!value) return "--";
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const formatNavValue = (value) => {
  const parsedValue = parseNumber(value);
  if (parsedValue === null || parsedValue <= 0) return "NAV Unavailable";
  return `₹${parsedValue.toFixed(4)}`;
};

const getNavAgeYears = (navDateStr) => {
  if (!navDateStr) return Infinity;
  const parts = navDateStr.split("-").map(Number);
  if (parts.length !== 3) return Infinity;
  const [day, month, year] = parts;
  const navDate = new Date(year, month - 1, day);
  return (Date.now() - navDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

const getSchemeBadges = (schemeName = "") => {
  const normalizedName = schemeName.toLowerCase();
  const badges = [];
  if (normalizedName.includes("direct")) badges.push("Direct");
  if (normalizedName.includes("regular")) badges.push("Regular");
  if (normalizedName.includes("growth")) badges.push("Growth");
  if (normalizedName.includes("idcw") || normalizedName.includes("dividend")) badges.push("Income");
  return badges.slice(0, 3);
};

const generatePieData = (category) => {
  if (category?.toLowerCase().includes("debt")) {
    return [
      { name: 'Corporate Bonds', value: 60, color: '#6366f1' },
      { name: 'Govt Securities', value: 30, color: '#10b981' },
      { name: 'Cash', value: 10, color: '#a855f7' }
    ];
  }
  return [
    { name: 'Large Cap', value: 50, color: '#6366f1' },
    { name: 'Mid Cap', value: 30, color: '#a855f7' },
    { name: 'Small Cap', value: 15, color: '#ec4899' },
    { name: 'Cash', value: 5, color: '#10b981' }
  ];
};

export default function MutualFundDetails() {
  const { schemeCode } = useParams();
  const navigate = useNavigate();
  const [isDarkMode] = useDarkMode();
  const { kycStatus, loading: kycLoading } = useKycStatus();
  const addToCart = useCartStore(state => state.addToCart);
  const addNotification = useNotificationStore(state => state.addNotification);

  const [detailLoading, setDetailLoading] = useState(true);
  const [selectedFund, setSelectedFund] = useState(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState([]);

  // Transaction state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState("buy");
  const [txAmount, setTxAmount] = useState("");
  const [txDuration, setTxDuration] = useState("12");
  const [isSipSelected, setIsSipSelected] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txMessage, setTxMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [mpinLoading, setMpinLoading] = useState(false);
  const [mpinError, setMpinError] = useState('');
  const [isMpinSet, setIsMpinSet] = useState(true);
  const [pendingPayload, setPendingPayload] = useState(null);

  const [investTab, setInvestTab] = useState('SIP');
  const [investAmount, setInvestAmount] = useState('');
  const [sipDate, setSipDate] = useState('5');
  const [chartRange, setChartRange] = useState('ALL');

  const [similarFunds, setSimilarFunds] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    if (!selectedFund?.meta?.scheme_category) return;
    
    let active = true;
    const loadSimilar = async () => {
      setSimilarLoading(true);
      try {
        const cat = selectedFund.meta.scheme_category.split(' ')[0];
        const res = await searchMutualFunds({ q: cat, limit: 6 });
        if (!active) return;
        
        let allRes = [];
        if (res.active) allRes = [...allRes, ...res.active];
        if (res.historical) allRes = [...allRes, ...res.historical];
        
        allRes = allRes.filter(f => String(f.schemeCode) !== String(schemeCode)).slice(0, 4);
        setSimilarFunds(allRes);
      } catch (err) {
        console.error("Failed to load similar funds", err);
      } finally {
        if (active) setSimilarLoading(false);
      }
    };
    
    loadSimilar();
    return () => { active = false; };
  }, [selectedFund?.meta?.scheme_category, schemeCode]);

  const handleInvestClick = () => {
    if (!kycLoading && kycStatus !== 'VERIFIED') setShowKycModal(true);
    else {
      setIsSipSelected(investTab === 'SIP');
      setTxAmount(investAmount);
      setTxType('buy');
      setShowTxModal(true);
    }
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await getPortfolio();
        if (data && data.holdings) {
          setPortfolioHoldings(data.holdings);
        }
      } catch (err) {
        console.error("Failed to fetch portfolio", err);
      }
    };
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (!schemeCode) return;
    let active = true;
    const controller = new AbortController();

    const loadFundDetails = async () => {
      setDetailLoading(true);
      try {
        const response = await getMutualFundDetails(schemeCode, { signal: controller.signal });
        if (!active) return;
        setSelectedFund(response);
      } catch (error) {
        if (error?.name !== "CanceledError") {
          setSelectedFund(null);
        }
      } finally {
        if (active) setDetailLoading(false);
      }
    };

    loadFundDetails();
    return () => {
      active = false;
      controller.abort();
    };
  }, [schemeCode]);

  const filteredData = useMemo(() => {
    if (!selectedFund?.data || selectedFund.data.length === 0) return [];
    
    let daysToKeep = Infinity;
    switch(chartRange) {
      case '1D': daysToKeep = 1; break;
      case '1W': daysToKeep = 7; break;
      case '1M': daysToKeep = 30; break;
      case '3M': daysToKeep = 90; break;
      case '6M': daysToKeep = 180; break;
      case '1Y': daysToKeep = 365; break;
      case '3Y': daysToKeep = 1095; break;
      case '5Y': daysToKeep = 1825; break;
      default: daysToKeep = Infinity;
    }

    if (daysToKeep === Infinity) return selectedFund.data;

    const [d, m, y] = selectedFund.data[0].date.split('-').map(Number);
    const latestDate = new Date(y, m - 1, d);
    const targetDate = new Date(latestDate);
    targetDate.setDate(targetDate.getDate() - daysToKeep);

    return selectedFund.data.filter(entry => {
      const [ed, em, ey] = entry.date.split('-').map(Number);
      const entryDate = new Date(ey, em - 1, ed);
      return entryDate >= targetDate;
    });
  }, [selectedFund, chartRange]);

  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const step = Math.max(1, Math.floor(filteredData.length / 300));
    
    return filteredData
      .filter((_, i) => i % step === 0)
      .reverse()
      .map(entry => ({
        date: formatNavDate(entry.date),
        nav: parseNumber(entry.nav)
      }))
      .filter(entry => entry.nav !== null);
  }, [filteredData]);

  const pieData = useMemo(() => {
    return generatePieData(selectedFund?.meta?.scheme_category);
  }, [selectedFund]);

  const latestNavRaw = parseNumber(selectedFund?.data?.[0]?.nav);
  const latestNav = latestNavRaw && latestNavRaw > 0 ? latestNavRaw : 0;
  const latestNavDate = selectedFund?.data?.[0]?.date ?? selectedFund?.latest?.date;
  const isInactive = getNavAgeYears(latestNavDate) > 3;

  const hasHolding = portfolioHoldings.some(h => String(h.schemeCode) === String(schemeCode));
  const currentHolding = portfolioHoldings.find(h => String(h.schemeCode) === String(schemeCode)) ?? null;

  const oldestNavInRange = filteredData.length > 0 ? parseNumber(filteredData[filteredData.length - 1].nav) : null;
  const navChangePercent = (latestNav && oldestNavInRange && oldestNavInRange > 0) 
    ? ((latestNav - oldestNavInRange) / oldestNavInRange) * 100 
    : 0;
  const isNavChangePositive = navChangePercent >= 0;

  const handleTransaction = async (e) => {
    if (e) e.preventDefault();

    if (!latestNav || latestNav <= 0) {
      setTxMessage({ type: 'error', text: 'Live NAV data is unavailable for this scheme. Transaction cannot proceed.' });
      return;
    }

    setTxLoading(true);
    setTxMessage(null);
    try {
      const payload = {
        schemeCode: Number(schemeCode),
        schemeName: selectedFund?.meta?.scheme_name,
        amount: Number(txAmount),
        nav: latestNav,
      };

      if (txType === 'buy') {
        if (isSipSelected) {
          await createSIP({
            ...payload,
            startDate: new Date().toISOString(),
            durationMonths: Number(txDuration)
          });
          setTxMessage({ type: 'success', text: `Successfully started SIP for ${payload.schemeName}` });
          setShowTxModal(false);
          setShowSuccessModal(true);
        } else {
          try {
            const res = await API.post('/payment/create-order', {
              amount: payload.amount,
              items: [payload]
            });
            setPendingPayload(payload);
            setIsMpinSet(res.data.isMpinSet);
            setMpinError('');
            setShowTxModal(false);
            setShowMpin(true);
          } catch (err) {
            if (err.response?.data?.message?.toLowerCase().includes("insufficient wallet balance")) {
              setTxMessage({ type: 'error', text: "Insufficient balance. Please top up your wallet." });
            } else {
              throw err;
            }
          }
        }
      } else {
        await sellFund({ ...payload, unitsToSell: Number(txAmount) / latestNav, currentNav: latestNav });
        setTxMessage({ type: 'success', text: `Successfully sold ${payload.schemeName}` });
        setTimeout(() => {
          setShowTxModal(false);
          setTxAmount("");
          setTxMessage(null);
        }, 2000);
      }
      const data = await getPortfolio();
      if (data && data.holdings) setPortfolioHoldings(data.holdings);
    } catch (err) {
      setTxMessage({ type: 'error', text: err.response?.data?.message || `Failed to ${txType} fund.` });
    } finally {
      setTxLoading(false);
    }
  };

  const handleMpinVerified = async (mpin) => {
    setMpinLoading(true); setMpinError('');
    try {
      await API.post('/payment/verify-payment', { mpin, items: [pendingPayload], totalAmount: pendingPayload.amount });
      setShowMpin(false);
      setTxMessage({ type: 'success', text: `Successfully bought ${pendingPayload.schemeName}` });
      setShowSuccessModal(true);
      const data = await getPortfolio();
      if (data && data.holdings) setPortfolioHoldings(data.holdings);
    } catch (err) {
      setMpinError(err.response?.data?.message || 'Verification failed');
    } finally {
      setMpinLoading(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Fund Intelligence</p>
      </div>
    );
  }

  if (!selectedFund) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center text-center">
        <Archive size={48} className="text-slate-300 dark:text-slate-700 mb-6" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Fund Intelligence Unavailable</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm">We couldn't retrieve the specified scheme details. It may have been deprecated or merged.</p>
        <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-indigo-500/20">
          Back to Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="w-full transition-colors duration-300 font-inter">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors mb-4">
          <ArrowLeft size={14} /> Return to Market Explorer
        </button>

        {/* HERO CARD REDESIGN */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`ui-card p-8 lg:p-12 overflow-hidden relative ${isInactive ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'dark:bg-slate-900/40'}`}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/5 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${isInactive ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                    {isInactive ? <Archive size={28} /> : (selectedFund.meta.fund_house?.charAt(0) || 'F')}
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1">{selectedFund.meta.fund_house}</p>
                    <div className="flex flex-wrap items-center gap-3">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isInactive ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                         {isInactive ? 'Historical' : 'Active Scheme'}
                       </span>
                       {getSchemeBadges(selectedFund.meta.scheme_name).map(b => (
                         <span key={b} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                           {b}
                         </span>
                       ))}
                    </div>
                 </div>
              </div>

              <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.1]">
                {selectedFund.meta.scheme_name}
              </h1>
              
              <div className="flex flex-wrap gap-10">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Market Capitalization</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{selectedFund.meta.scheme_category || 'Mutual Fund'}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Volatility Risk</p>
                    <div className="flex items-center gap-2">
                       <ShieldAlert size={18} className="text-amber-500" />
                       <p className="text-lg font-black text-slate-900 dark:text-white">Moderate — High</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:w-96 shrink-0 bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800/50 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4">Real-time Terminal</p>
              <div className="mb-8">
                <div className="flex items-end gap-3 mb-2">
                   <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{formatNavValue(latestNav)}</h2>
                   <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black mb-1 ${isNavChangePositive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                      {isNavChangePositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {Math.abs(navChangePercent).toFixed(2)}%
                   </div>
                </div>
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">NAV Pulse: {formatNavDate(latestNavDate)}</p>
              </div>

              <div className="space-y-4">
                {isInactive ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center gap-3">
                     <Archive size={20} className="text-amber-500" />
                     <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">Investments paused for this scheme</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleInvestClick}
                      className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                    >
                      <Zap size={18} /> Invest
                    </button>
                    {hasHolding && (
                      <button
                        onClick={() => { setTxType('sell'); setShowTxModal(true); }}
                        className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        Sell Funds
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* PERFORMANCE CHART */}
            <div className="ui-card p-8 dark:bg-slate-900/40 h-[450px] flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shadow-inner">
                    <Activity size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Growth Telemetry</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Historical NAV Progression</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                  {['1M', '6M', '1Y', '3Y', '5Y', 'ALL'].map(range => (
                    <button
                      key={range}
                      onClick={() => setChartRange(range)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartRange === range ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b20" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} minTickGap={40} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }} 
                      labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }} 
                      formatter={(value) => [`₹${value}`, 'NAV']} 
                    />
                    <Area type="monotone" dataKey="nav" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI INSIGHT */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] pointer-events-none rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100 mb-8 flex items-center gap-3">
                  <Sparkles size={18} /> Neural Analysis
                </h3>
                <p className="text-lg font-bold text-white leading-relaxed tracking-tight">
                  Our models rank this <span className="text-indigo-200">{selectedFund.meta.scheme_category}</span> scheme as a <span className="text-emerald-300">Tier-1 Long Term Asset</span>. It demonstrates resilient alpha generation with a Sharpe ratio exceeding industry averages. Perfect for capital appreciation over a 5-year cycle.
                </p>
              </div>

              {/* ASSET ALLOCATION */}
              <div className="ui-card p-8 dark:bg-slate-900/40 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-inner">
                    <PieChartIcon size={24} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Risk Weighted Exposure</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Asset Distribution</p>
                  </div>
                </div>
                <div className="flex-1 relative min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} stroke="none" paddingAngle={4} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px'}} 
                        itemStyle={{color: '#fff', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">100%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}} />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[60px]">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FUND STATS GRID */}
            <div className="ui-card p-8 dark:bg-slate-900/40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shadow-inner">
                  <Calendar size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Scheme Blueprint</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Regulatory Metadata</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Scheme Identification', value: selectedFund.meta.scheme_code },
                  { label: 'Market Segment', value: selectedFund.meta.scheme_category },
                  { label: 'Execution Model', value: selectedFund.meta.scheme_type || 'Open Ended' },
                  { label: 'Custodian / AMC', value: selectedFund.meta.fund_house },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">{label}</p>
                    <p className="text-[13px] font-black text-slate-800 dark:text-slate-200 line-clamp-2">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* TRANSACTION CARD REDESIGN */}
            <div className="ui-card p-8 dark:bg-slate-900/40 sticky top-32">
              <div className="flex bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl mb-8 border border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setInvestTab('SIP')} 
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${investTab === 'SIP' ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}
                >
                  Monthly SIP
                </button>
                <button 
                  onClick={() => setInvestTab('LUMPSUM')} 
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${investTab === 'LUMPSUM' ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}
                >
                  One-time
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1 mb-2 block">Investment Amount</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black text-lg">₹</span>
                    <input 
                      type="number" 
                      min="100" 
                      step="100" 
                      value={investAmount} 
                      onChange={e => setInvestAmount(e.target.value)} 
                      placeholder="0.00" 
                      className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white font-black text-xl outline-none transition-all tabular-nums placeholder:text-slate-300 dark:placeholder:text-slate-800" 
                    />
                  </div>
                </div>

                {investTab === 'SIP' && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1 mb-2 block">Monthly Execution Date</label>
                    <select 
                      value={sipDate} 
                      onChange={e => setSipDate(e.target.value)} 
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-black text-sm outline-none cursor-pointer focus:border-indigo-500"
                    >
                      {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}th of every month</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Load</p>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">0.00% NIL</p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <button 
                  disabled={isInactive} 
                  onClick={() => {
                    const amt = Number(investAmount);
                    if (amt < 100) {
                      const msg = 'Minimum investment amount is ₹100.';
                      toast.error(msg, {
                        style: { 
                          borderRadius: '12px', 
                          background: isDarkMode ? '#1E293B' : '#fff', 
                          color: isDarkMode ? '#fff' : '#0f172a' 
                        }
                      });
                      addNotification({
                        _id: `notif-${Date.now()}`,
                        title: 'Minimum Amount Required',
                        message: msg,
                        type: 'warning',
                        read: false,
                        createdAt: new Date().toISOString(),
                      });
                      return;
                    }
                    addToCart({
                      schemeCode: selectedFund.meta.scheme_code,
                      schemeName: selectedFund.meta.scheme_name,
                      amount: amt,
                      type: investTab,
                      duration: investTab === 'SIP' ? 12 : null,
                      nav: latestNav
                    });
                    const successMsg = `${selectedFund.meta.scheme_name} added to cart.`;
                    toast.success(successMsg, {
                      icon: '🛒',
                      style: { 
                        borderRadius: '12px', 
                        background: isDarkMode ? '#1E293B' : '#fff', 
                        color: isDarkMode ? '#fff' : '#0f172a' 
                      }
                    });
                    addNotification({
                      _id: `notif-${Date.now()}`,
                      title: 'Added to Cart',
                      message: `${selectedFund.meta.scheme_name} (₹${amt.toLocaleString('en-IN')}) added to your investment cart.`,
                      type: 'cart',
                      read: false,
                      createdAt: new Date().toISOString(),
                    });
                  }}
                  className="w-full py-4 bg-white dark:bg-slate-900 border border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button 
                  disabled={isInactive}
                  onClick={handleInvestClick}
                  className="w-full py-5 bg-indigo-600 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                >
                  <ShieldCheck size={20} /> {investTab === 'SIP' ? 'Initialize SIP' : 'Purchase '}
                </button>
                <button 
                  disabled={isInactive} 
                  className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SIMILAR FUNDS */}
        {similarFunds.length > 0 && (
          <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
            <header className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Extended Universe</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Comparable Performance</h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarFunds.map((fund, idx) => (
                <motion.div 
                  key={fund.schemeCode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => { navigate(`/dashboard-area/mutual-funds/${fund.schemeCode}`); window.scrollTo(0,0); }}
                  className="ui-card p-6 dark:bg-slate-900/50 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                    {fund.schemeName.charAt(0)}
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-black text-sm line-clamp-2 mb-8 group-hover:text-indigo-500 transition-colors tracking-tight">{fund.schemeName}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">1Y Yield</p>
                      <p className={`text-xs font-black ${fund.return1y > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {fund.return1y ? `${fund.return1y > 0 ? '+' : ''}${fund.return1y}%` : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">3Y Alpha</p>
                      <p className={`text-xs font-black ${fund.return3y > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {fund.return3y ? `${fund.return3y > 0 ? '+' : ''}${fund.return3y}%` : '--'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS OVERHAUL */}
      <AnimatePresence>
        {showTxModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={() => setShowTxModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{scale: 0.95, y: 40}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 40}} className="ui-card dark:bg-slate-900 border-none w-full max-w-md overflow-hidden relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              <div className="p-10">
                <button onClick={() => setShowTxModal(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"><X size={18} /></button>
                <div className="mb-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Order Execution</p>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{txType === 'buy' ? (isSipSelected ? 'Initialize SIP' : 'Market Lumpsum') : 'Liquidation Order'}</h3>
                   <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-3 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-1">{selectedFund?.meta?.scheme_name}</p>
                </div>

                {txType === 'buy' && (
                  <div className="flex bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl mb-10 border border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => setIsSipSelected(false)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${!isSipSelected ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>One-time</button>
                    <button type="button" onClick={() => setIsSipSelected(true)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${isSipSelected ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>Monthly SIP</button>
                  </div>
                )}

                {txMessage && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={`mb-8 p-5 rounded-2xl flex items-start gap-4 text-xs font-black uppercase tracking-tight border ${txMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}>
                    {txMessage.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <ShieldAlert className="shrink-0 mt-0.5" size={18} />}
                    <span>{txMessage.text}</span>
                  </motion.div>
                )}

                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-1 mb-2 block">
                        {txType === 'buy' ? 'Investment Amount' : 'Units to Liquidate'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black text-lg">
                          {txType === 'buy' ? '₹' : 'Σ'}
                        </span>
                        <input 
                          type="number" 
                          value={txAmount} 
                          onChange={(e) => setTxAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-black text-xl outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                   </div>

                   {txType === 'buy' && isSipSelected && (
                     <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-1 mb-2 block">Duration</label>
                          <select value={txDuration} onChange={e => setTxDuration(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-black text-sm outline-none">
                            <option value="12">12 Months</option>
                            <option value="24">24 Months</option>
                            <option value="36">36 Months</option>
                          </select>
                        </div>
                     </div>
                   )}
                </div>

                <div className="mt-10">
                   <button 
                     onClick={handleTransaction}
                     disabled={txLoading || !txAmount}
                     className="w-full py-5 bg-indigo-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                   >
                     {txLoading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <><ShieldCheck size={18} /> {txType === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}</>
                     )}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" />
            <motion.div
              initial={{scale: 0.9, opacity: 0, y: 8}}
              animate={{scale: 1, opacity: 1, y: 0}}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative ui-card w-full max-w-sm p-10 text-center"
            >
              {/* Icon */}
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-500 dark:text-emerald-400" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Order Successful</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                Your mutual fund purchase has been placed successfully.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowSuccessModal(false); navigate('/dashboard-area/portfolio'); }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20"
                >
                  View Portfolio
                </button>
                <button
                  onClick={() => { setShowSuccessModal(false); navigate('/dashboard-area/mutual-funds'); }}
                  className="w-full py-3.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-[0.15em] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showKycModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} onClick={() => setShowKycModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{scale: 0.95, y: 40}} animate={{scale: 1, y: 0}} className="ui-card dark:bg-slate-900 w-full max-w-md p-10 text-center relative">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={32} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">KYC Verification Required</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">To comply with SEBI regulations and secure your assets, please complete your identity verification.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/dashboard-area/kyc')} className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20">Verify Identity Now</button>
                <button onClick={() => setShowKycModal(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">I'll do it later</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MpinModal
        isOpen={showMpin}
        onClose={() => { setShowMpin(false); setMpinError(''); setPendingPayload(null); }}
        onVerified={handleMpinVerified}
        title="Confirm Fund Purchase"
        description={pendingPayload ? `${pendingPayload.schemeName} · ₹${Number(pendingPayload.amount).toLocaleString('en-IN')}` : ''}
        isLoading={mpinLoading}
        error={mpinError}
        isMpinSet={isMpinSet}
      />
    </div>
  );
}
