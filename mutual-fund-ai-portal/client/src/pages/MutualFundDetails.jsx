import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, Wallet, X, Sparkles, Activity, PieChart as PieChartIcon, Calendar, ArrowLeft, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import { getMutualFundDetails } from "../services/mutualFunds";
import { getPortfolio, sellFund, createSIP, createRazorpayOrder, verifyRazorpayPayment } from "../services/portfolio";
import { useKycStatus } from "../hooks/useKycStatus";

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
      { name: 'Corporate Bonds', value: 60, color: '#3b82f6' },
      { name: 'Govt Securities', value: 30, color: '#10b981' },
      { name: 'Cash', value: 10, color: '#8b5cf6' }
    ];
  }
  return [
    { name: 'Large Cap', value: 50, color: '#3b82f6' },
    { name: 'Mid Cap', value: 30, color: '#8b5cf6' },
    { name: 'Small Cap', value: 15, color: '#ec4899' },
    { name: 'Cash', value: 5, color: '#10b981' }
  ];
};

export default function MutualFundDetails() {
  const { schemeCode } = useParams();
  const navigate = useNavigate();
  const { kycStatus, loading: kycLoading } = useKycStatus();

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

  const chartData = useMemo(() => {
    if (!selectedFund?.data) return [];
    const data = selectedFund.data;
    const step = Math.max(1, Math.floor(data.length / 300));
    
    return data
      .filter((_, i) => i % step === 0)
      .reverse()
      .map(entry => ({
        date: formatNavDate(entry.date),
        nav: parseNumber(entry.nav)
      }))
      .filter(entry => entry.nav !== null);
  }, [selectedFund]);

  const pieData = useMemo(() => {
    return generatePieData(selectedFund?.meta?.scheme_category);
  }, [selectedFund]);

  const handleTransaction = async (e) => {
    e.preventDefault();

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
          const order = await createRazorpayOrder(Number(txAmount));
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Snsc6Pg1LbIYVH",
            amount: order.amount,
            currency: "INR",
            name: "Mutual Fund Sahi Hai",
            description: `Buy ${payload.schemeName}`,
            order_id: order.id,
            handler: async function (response) {
              try {
                await verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  ...payload
                });
                
                setTxMessage({ type: 'success', text: `Successfully bought ${payload.schemeName}` });
                setShowTxModal(false);
                setShowSuccessModal(true);
                
                const data = await getPortfolio();
                if (data && data.holdings) setPortfolioHoldings(data.holdings);
              } catch (err) {
                setTxMessage({ type: 'error', text: "Payment verification failed" });
              }
            },
            theme: { color: "#3b82f6" }
          };
          const rzp1 = new window.Razorpay(options);
          rzp1.on('payment.failed', function (response){
            setTxMessage({ type: 'error', text: response.error.description });
          });
          rzp1.open();
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

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!selectedFund) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-400 p-8 flex flex-col items-center justify-center">
        <p>Fund details could not be loaded.</p>
        <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
          Back to Funds
        </button>
      </div>
    );
  }

  const latestNavRaw = parseNumber(selectedFund?.data?.[0]?.nav);
  const latestNav = latestNavRaw && latestNavRaw > 0 ? latestNavRaw : 0;
  const latestNavDate = selectedFund?.data?.[0]?.date ?? selectedFund?.latest?.date;
  const isInactive = getNavAgeYears(latestNavDate) > 3;

  const hasHolding = portfolioHoldings.some(h => String(h.schemeCode) === String(schemeCode));
  const currentHolding = portfolioHoldings.find(h => String(h.schemeCode) === String(schemeCode)) ?? null;

  const getNavAtDaysAgo = (days) => {
    if (!selectedFund.data || selectedFund.data.length < 2) return null;
    const [d, m, y] = selectedFund.data[0].date.split('-');
    const targetDate = new Date(y, m - 1, d);
    targetDate.setDate(targetDate.getDate() - days);
    
    let closestNav = null;
    let minDiff = Infinity;
    
    for (let entry of selectedFund.data) {
      const [ed, em, ey] = entry.date.split('-');
      const entryDate = new Date(ey, em - 1, ed);
      const diff = Math.abs(targetDate - entryDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestNav = parseNumber(entry.nav);
      }
    }
    
    if (minDiff <= 15 * 24 * 60 * 60 * 1000 && closestNav) return closestNav;
    return null;
  };

  const navChangePercent = selectedFund.data && selectedFund.data.length >= 2
    ? ((latestNav - parseNumber(selectedFund.data[1].nav)) / parseNumber(selectedFund.data[1].nav)) * 100
    : 0;
  const isNavChangePositive = navChangePercent >= 0;

  return (
    <div className="w-full min-h-screen bg-[#0B1120] text-slate-200 font-sans pb-10">
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
        
        <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Explorer
        </button>

        {/* HERO CARD */}
        <div className={`backdrop-blur-md rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isInactive ? 'bg-[#111827]/70 border border-amber-900/40' : 'bg-[#111827]/90 border border-slate-700/50'}`}>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex items-start gap-5">
            <div className={`w-16 h-16 mt-1 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border shrink-0 ${isInactive ? 'bg-gradient-to-br from-slate-600 to-slate-700 border-white/5' : 'bg-gradient-to-br from-blue-600 to-indigo-600 border-white/10'}`}>
              {isInactive ? <Archive size={28} className="text-amber-400/80" /> : (selectedFund.meta.fund_house?.charAt(0) || 'F')}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
                {selectedFund.meta.scheme_name}
              </h1>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedFund.meta.fund_house}
                </span>
                {isInactive ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Archive size={9}/> Inactive Fund
                  </span>
                ) : (
                  getSchemeBadges(selectedFund.meta.scheme_name).map(b => (
                    <span key={b} className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {b}
                    </span>
                  ))
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Activity size={10}/> {selectedFund.meta.scheme_category || 'Mutual Fund'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 lg:gap-8 bg-[#0B1120]/50 p-5 rounded-2xl border border-slate-800 w-full lg:w-auto">
            <div className="text-center sm:text-left">
              <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider mb-1">
                {isInactive ? 'Last Known NAV' : 'Latest NAV'}
              </p>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                {isInactive ? (
                  <span className="text-lg font-bold text-amber-400/80">Historical Only</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">{formatNavValue(latestNav)}</span>
                    <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded ${isNavChangePositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {isNavChangePositive ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>} {navChangePercent.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                As of {formatNavDate(latestNavDate)}
              </p>
            </div>

            <div className="hidden sm:block w-px h-16 bg-slate-800"></div>

            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {isInactive ? (
                <button disabled className="w-full px-6 py-2.5 bg-slate-700/50 text-slate-500 rounded-xl text-sm font-semibold cursor-not-allowed border border-slate-700/50">
                  Investing Disabled
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!kycLoading && kycStatus !== 'VERIFIED') setShowKycModal(true);
                      else { setTxType('buy'); setShowTxModal(true); }
                    }}
                    className="w-full px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2"
                  >
                    <Wallet size={16}/> Invest Now
                  </button>
                  {hasHolding && (
                    <button
                      onClick={() => {
                        if (!kycLoading && kycStatus !== 'VERIFIED') setShowKycModal(true);
                        else { setTxType('sell'); setShowTxModal(true); }
                      }}
                      className="w-full px-8 py-2.5 bg-transparent border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl text-sm font-semibold transition-all"
                    >
                      Redeem
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl h-[400px] flex flex-col">
            <h3 className="text-sm uppercase tracking-wider font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Activity size={16} className={isInactive ? 'text-amber-400' : 'text-blue-500'} />
              {isInactive ? 'Historical Performance' : 'Performance History'}
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }} itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }} labelStyle={{ color: '#94a3b8', fontSize: '12px' }} formatter={(value) => [`₹${value}`, 'NAV']} />
                  <Area type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0B1120', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm uppercase tracking-wider font-bold text-slate-300 mb-4 flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-400" />
              Asset Allocation
            </h3>
            <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} stroke="rgba(15,23,42,0.8)" strokeWidth={2} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px'}} itemStyle={{color: '#f8fafc', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total</span>
                <span className="text-2xl font-bold text-white">100%</span>
              </div>
            </div>
            <div className="mt-6 space-y-3 bg-[#0B1120]/50 p-4 rounded-2xl border border-slate-800">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                    {d.name}
                  </div>
                  <div className="text-slate-100">{d.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm uppercase tracking-wider font-bold text-slate-300 mb-6 flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              Fund Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Scheme Code</p><p className="text-slate-200 font-bold">{selectedFund.meta.scheme_code}</p></div>
              <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Category</p><p className="text-slate-200 font-bold truncate">{selectedFund.meta.scheme_category}</p></div>
              <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Type</p><p className="text-slate-200 font-bold">{selectedFund.meta.scheme_type || 'Open Ended'}</p></div>
              <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Fund House</p><p className="text-slate-200 font-bold truncate">{selectedFund.meta.fund_house}</p></div>
            </div>
          </div>

          <div className="md:col-span-1 bg-gradient-to-br from-[#1e1b4b] to-[#111827] border border-purple-500/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(139,92,246,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] pointer-events-none rounded-full"></div>
            <h3 className="text-sm uppercase tracking-wider font-bold text-purple-300 mb-4 flex items-center gap-2 relative z-10">
              <Sparkles size={16} className="text-purple-400" /> AI Insight
            </h3>
            <p className="text-sm text-purple-100/80 leading-relaxed relative z-10">
              This <span className="text-purple-200 font-semibold">{selectedFund.meta.scheme_category}</span> fund exhibits characteristic volatility but offers strong potential for long-term wealth creation. It maintains a well-balanced portfolio, making it ideal for investors with a 5+ year horizon.
            </p>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showTxModal && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-md">
            <motion.div initial={{scale: 0.95, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 20}} className="bg-[#111827] border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
              <div className="p-6">
                <button onClick={() => setShowTxModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><X size={16} /></button>
                <h3 className="text-2xl font-bold text-white mb-1">{txType === 'buy' ? (isSipSelected ? 'Start SIP' : 'Buy Lumpsum') : 'Redeem Mutual Fund'}</h3>
                <p className="text-xs font-medium text-slate-400 mb-6 bg-slate-800/50 inline-block px-3 py-1.5 rounded-lg border border-slate-700/50">{selectedFund?.meta?.scheme_name}</p>

                {txType === 'buy' && (
                  <div className="flex bg-[#0B1120] p-1.5 rounded-xl mb-6 border border-slate-800">
                    <button type="button" onClick={() => setIsSipSelected(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${!isSipSelected ? 'bg-blue-600 shadow-md text-white' : 'text-slate-500 hover:text-slate-300'}`}>Lumpsum</button>
                    <button type="button" onClick={() => setIsSipSelected(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${isSipSelected ? 'bg-blue-600 shadow-md text-white' : 'text-slate-500 hover:text-slate-300'}`}>SIP</button>
                  </div>
                )}

                {txMessage && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border ${txMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {txMessage.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <ShieldAlert className="shrink-0 mt-0.5" size={18} />}
                    <span>{txMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleTransaction}>
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" min="100" step="100" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="5,000" className="w-full pl-8 pr-4 py-3.5 bg-[#0B1120] border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white text-lg font-bold transition-all" />
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <p className="text-[10px] text-slate-500 font-medium">MIN: ₹100</p>
                      <p className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded">NAV: {formatNavValue(latestNav)}</p>
                    </div>
                    {txType === 'sell' && currentHolding && latestNav > 0 && (
                      <button type="button" onClick={() => setTxAmount(String(Math.floor(currentHolding.units * latestNav)))} className="mt-3 w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                        Sell All
                      </button>
                    )}
                  </div>

                  {txType === 'buy' && isSipSelected && (
                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Duration</label>
                      <select value={txDuration} onChange={(e) => setTxDuration(e.target.value)} className="w-full px-4 py-3.5 bg-[#0B1120] border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm font-bold transition-all appearance-none">
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="36">3 Years</option>
                        <option value="60">5 Years</option>
                        <option value="120">10 Years</option>
                      </select>
                    </div>
                  )}

                  <button type="submit" disabled={txLoading} className={`w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-lg flex justify-center items-center gap-2 ${txLoading ? 'opacity-70 cursor-not-allowed' : ''} ${txType === 'buy' ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'}`}>
                    {txLoading ? 'PROCESSING...' : `CONFIRM ${txType === 'buy' && isSipSelected ? 'SIP' : txType.toUpperCase()}`}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/90 backdrop-blur-lg">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111827] border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
              <h3 className="text-2xl font-bold text-white mb-2">Order Successful!</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">Your {isSipSelected ? 'SIP' : 'Lumpsum'} investment for {selectedFund?.meta?.scheme_name} has been processed.</p>
              <div className="space-y-3">
                <button onClick={() => navigate('/dashboard-area/portfolio')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm tracking-wide">GO TO PORTFOLIO</button>
                <button onClick={() => setShowSuccessModal(false)} className="w-full py-3.5 text-slate-500 hover:text-slate-300 text-xs font-bold tracking-wider uppercase">Continue Browsing</button>
              </div>
            </motion.div>
          </div>
        )}

        {showKycModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#111827] border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden relative">
              <div className="p-7 text-center">
                <button onClick={() => setShowKycModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert size={30} className="text-blue-400" /></div>
                <h3 className="text-xl font-bold text-white mb-2">Complete Your KYC</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Complete your KYC to start investing. It only takes a few minutes.</p>
                <div className="space-y-3">
                  <button onClick={() => navigate('/dashboard-area/profile')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Complete KYC Now</button>
                  <button onClick={() => setShowKycModal(false)} className="w-full py-2.5 text-slate-500 text-xs font-bold tracking-wider uppercase">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
