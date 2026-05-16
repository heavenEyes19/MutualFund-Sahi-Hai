import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, Wallet, X, Sparkles, Activity, PieChart as PieChartIcon, Calendar, ArrowLeft, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import { getMutualFundDetails, searchMutualFunds } from "../services/mutualFunds";
import { getPortfolio, sellFund, createSIP, createRazorpayOrder, verifyRazorpayPayment } from "../services/portfolio";
import { useKycStatus } from "../hooks/useKycStatus";
import useCartStore from "../store/useCartStore";

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

  const [investTab, setInvestTab] = useState('SIP');
  const [investAmount, setInvestAmount] = useState('');
  const [sipDate, setSipDate] = useState('1');
  const [chartRange, setChartRange] = useState('ALL');

  const addToCart = useCartStore(state => state.addToCart);

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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!selectedFund) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-slate-500 p-8 flex flex-col items-center justify-center">
        <p className="font-semibold">Fund details could not be loaded.</p>
        <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
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

  const oldestNavInRange = filteredData.length > 0 ? parseNumber(filteredData[filteredData.length - 1].nav) : null;
  const navChangePercent = (latestNav && oldestNavInRange && oldestNavInRange > 0) 
    ? ((latestNav - oldestNavInRange) / oldestNavInRange) * 100 
    : 0;
  const isNavChangePositive = navChangePercent >= 0;

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] text-slate-900 font-sans pb-10">
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
        
        <button onClick={() => navigate('/dashboard-area/mutual-funds')} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold transition-colors">
          <ArrowLeft size={16} /> Back to Explorer
        </button>

        {/* HERO CARD */}
        <div className={`rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isInactive ? 'bg-slate-50 border border-amber-200' : 'bg-white border border-slate-100'}`}>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex items-start gap-5">
            <div className={`w-16 h-16 mt-1 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 ${isInactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
              {isInactive ? <Archive size={28} className="text-amber-500" /> : (selectedFund.meta.fund_house?.charAt(0) || 'F')}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                {selectedFund.meta.scheme_name}
              </h1>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedFund.meta.fund_house}
                </span>
                {isInactive ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                    <Archive size={9}/> Inactive Fund
                  </span>
                ) : (
                  getSchemeBadges(selectedFund.meta.scheme_name).map(b => (
                    <span key={b} className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                      {b}
                    </span>
                  ))
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                  <Activity size={10}/> {selectedFund.meta.scheme_category || 'Mutual Fund'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 lg:gap-8 bg-slate-50 p-5 rounded-2xl border border-slate-100 w-full lg:w-auto">
            <div className="text-center sm:text-left">
              <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider mb-1">
                {isInactive ? 'Last Known NAV' : 'Latest NAV'}
              </p>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                {isInactive ? (
                  <span className="text-lg font-bold text-amber-500">Historical Only</span>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">{formatNavValue(latestNav)}</span>
                    <span className={`text-xs font-bold flex items-center px-1.5 py-0.5 rounded ${isNavChangePositive ? 'text-emerald-600 bg-emerald-100' : 'text-red-600 bg-red-100'}`}>
                      {isNavChangePositive ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>} {navChangePercent.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                As of {formatNavDate(latestNavDate)}
              </p>
            </div>

            <div className="hidden sm:block w-px h-16 bg-slate-200"></div>

            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {isInactive ? (
                <button disabled className="w-full px-6 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed border border-slate-200">
                  Investing Disabled
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!kycLoading && kycStatus !== 'VERIFIED') setShowKycModal(true);
                      else { setTxType('buy'); setShowTxModal(true); }
                    }}
                    className="w-full px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex justify-center items-center gap-2"
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
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-[400px] flex flex-col">
            <h3 className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2">
              <Activity size={16} className={isInactive ? 'text-amber-500' : 'text-emerald-500'} />
              {isInactive ? 'Historical Performance' : 'Performance History'}
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} itemStyle={{ color: '#0f172a', fontWeight: 'bold' }} labelStyle={{ color: '#64748b', fontSize: '12px' }} formatter={(value) => [`₹${value}`, 'NAV']} />
                  <Area type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Chart Range Toggles */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              {['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'].map(range => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartRange === range ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 blur-[50px] pointer-events-none rounded-full"></div>
              <h3 className="text-sm uppercase tracking-wider font-bold text-emerald-800 mb-4 flex items-center gap-2 relative z-10">
                <Sparkles size={16} className="text-emerald-500" /> AI Insight
              </h3>
              <p className="text-sm text-emerald-900/80 leading-relaxed relative z-10">
                This <span className="text-emerald-700 font-bold">{selectedFund.meta.scheme_category}</span> fund exhibits characteristic volatility but offers strong potential for long-term wealth creation. It maintains a well-balanced portfolio, making it ideal for investors with a 5+ year horizon.
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2">
                <PieChartIcon size={16} className="text-emerald-500" />
                Asset Allocation
              </h3>
              <div className="flex-1 relative flex items-center justify-center min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="#ffffff" strokeWidth={2} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px'}} itemStyle={{color: '#0f172a', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Total</span>
                  <span className="text-xl font-bold text-slate-900">100%</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                      {d.name}
                    </div>
                    <div className="text-slate-900">{d.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col h-fit self-start sticky top-24">
            <div className="flex bg-slate-50 p-1.5 rounded-xl mb-6 border border-slate-100">
              <button 
                onClick={() => setInvestTab('SIP')} 
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all tracking-wider ${investTab === 'SIP' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Monthly SIP
              </button>
              <button 
                onClick={() => setInvestTab('LUMPSUM')} 
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all tracking-wider ${investTab === 'LUMPSUM' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                One-time
              </button>
            </div>

            <div className="flex-1">
              {investTab === 'SIP' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">SIP Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" min="100" step="100" value={investAmount} onChange={e => setInvestAmount(e.target.value)} placeholder="5,000" className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-bold transition-all shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Monthly SIP Date</label>
                    <select value={sipDate} onChange={e => setSipDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-bold transition-all appearance-none shadow-sm">
                      {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d} of every month</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Investment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" min="100" step="100" value={investAmount} onChange={e => setInvestAmount(e.target.value)} placeholder="50,000" className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-bold transition-all shadow-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button 
                disabled={isInactive} 
                onClick={() => {
                  const amt = Number(investAmount);
                  if (amt < 100) {
                    alert("Minimum investment amount is ₹100");
                    return;
                  }
                  addToCart({
                    schemeCode: selectedFund.meta.scheme_code,
                    schemeName: selectedFund.meta.scheme_name,
                    amount: amt,
                    type: investTab,
                    duration: investTab === 'SIP' ? 12 : null, // default duration
                    nav: latestNav
                  });
                  alert(`${selectedFund.meta.scheme_name} added to cart!`);
                }}
                className="w-full py-3 bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Add to Cart
              </button>
              <button 
                disabled={isInactive}
                onClick={handleInvestClick}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {investTab === 'SIP' ? 'Start SIP' : 'Invest Now'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-6 flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500" />
            Fund Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Scheme Code</p><p className="text-slate-900 font-bold">{selectedFund.meta.scheme_code}</p></div>
            <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Category</p><p className="text-slate-900 font-bold truncate">{selectedFund.meta.scheme_category}</p></div>
            <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Type</p><p className="text-slate-900 font-bold">{selectedFund.meta.scheme_type || 'Open Ended'}</p></div>
            <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Fund House</p><p className="text-slate-900 font-bold truncate">{selectedFund.meta.fund_house}</p></div>
          </div>
        </div>

      </div>

      {similarFunds.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-6">
          <h3 className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            Similar Funds You Might Like
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarFunds.map(fund => (
              <div 
                key={fund.schemeCode}
                onClick={() => {
                  navigate(`/dashboard-area/mutual-funds/${fund.schemeCode}`);
                  window.scrollTo(0,0);
                }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-emerald-500/50 hover:bg-white transition-all cursor-pointer group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                  {fund.schemeName.charAt(0)}
                </div>
                <h4 className="text-slate-900 font-bold text-sm line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">{fund.schemeName}</h4>
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">1Y Return</p>
                    <p className={`text-sm font-bold ${fund.return1y > 0 ? 'text-emerald-600' : fund.return1y < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {fund.return1y ? `${fund.return1y > 0 ? '+' : ''}${fund.return1y}%` : '--'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">3Y Return</p>
                    <p className={`text-sm font-bold ${fund.return3y > 0 ? 'text-emerald-600' : fund.return3y < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {fund.return3y ? `${fund.return3y > 0 ? '+' : ''}${fund.return3y}%` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTxModal && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{scale: 0.95, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 20}} className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
              <div className="p-6">
                <button onClick={() => setShowTxModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"><X size={16} /></button>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{txType === 'buy' ? (isSipSelected ? 'Start SIP' : 'Buy Lumpsum') : 'Redeem Mutual Fund'}</h3>
                <p className="text-xs font-bold text-slate-500 mb-6 bg-slate-50 inline-block px-3 py-1.5 rounded-lg border border-slate-200">{selectedFund?.meta?.scheme_name}</p>

                {txType === 'buy' && (
                  <div className="flex bg-slate-50 p-1.5 rounded-xl mb-6 border border-slate-100">
                    <button type="button" onClick={() => setIsSipSelected(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${!isSipSelected ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>Lumpsum</button>
                    <button type="button" onClick={() => setIsSipSelected(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${isSipSelected ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>SIP</button>
                  </div>
                )}

                {txMessage && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-bold border ${txMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {txMessage.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <ShieldAlert className="shrink-0 mt-0.5" size={18} />}
                    <span>{txMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleTransaction}>
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" min="100" step="100" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="5,000" className="w-full pl-8 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 text-lg font-bold transition-all shadow-sm" />
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <p className="text-[10px] text-slate-500 font-medium">MIN: ₹100</p>
                      <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">NAV: {formatNavValue(latestNav)}</p>
                    </div>
                    {txType === 'sell' && currentHolding && latestNav > 0 && (
                      <button type="button" onClick={() => setTxAmount(String(Math.floor(currentHolding.units * latestNav)))} className="mt-3 w-full py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                        Sell All
                      </button>
                    )}
                  </div>

                  {txType === 'buy' && isSipSelected && (
                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Duration</label>
                      <select value={txDuration} onChange={(e) => setTxDuration(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 text-sm font-bold transition-all appearance-none shadow-sm">
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="36">3 Years</option>
                        <option value="60">5 Years</option>
                        <option value="120">10 Years</option>
                      </select>
                    </div>
                  )}

                  <button type="submit" disabled={txLoading} className={`w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-md flex justify-center items-center gap-2 ${txLoading ? 'opacity-70 cursor-not-allowed' : ''} ${txType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                    {txLoading ? 'PROCESSING...' : `CONFIRM ${txType === 'buy' && isSipSelected ? 'SIP' : txType.toUpperCase()}`}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-slate-100 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Order Successful!</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Your {isSipSelected ? 'SIP' : 'Lumpsum'} investment for {selectedFund?.meta?.scheme_name} has been processed.</p>
              <div className="space-y-3">
                <button onClick={() => navigate('/dashboard-area/portfolio')} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm tracking-wide">GO TO PORTFOLIO</button>
                <button onClick={() => setShowSuccessModal(false)} className="w-full py-3.5 text-slate-500 hover:text-slate-900 text-xs font-bold tracking-wider uppercase">Continue Browsing</button>
              </div>
            </motion.div>
          </div>
        )}

        {showKycModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl">
              <div className="p-7 text-center">
                <button onClick={() => setShowKycModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"><X size={16} /></button>
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert size={30} className="text-emerald-500" /></div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Complete Your KYC</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">Complete your KYC to start investing. It only takes a few minutes.</p>
                <div className="space-y-3">
                  <button onClick={() => navigate('/dashboard-area/profile')} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm">Complete KYC Now</button>
                  <button onClick={() => setShowKycModal(false)} className="w-full py-2.5 text-slate-500 hover:text-slate-900 text-xs font-bold tracking-wider uppercase">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
