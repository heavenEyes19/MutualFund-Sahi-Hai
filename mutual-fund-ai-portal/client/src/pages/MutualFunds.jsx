import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, Wallet, X, Sparkles, Activity, PieChart as PieChartIcon, Calendar, ArrowRight, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import {
  getMutualFundDetails,
  listMutualFunds,
  searchMutualFunds,
} from "../services/mutualFunds";
import { getPortfolio, sellFund, createSIP, createRazorpayOrder, verifyRazorpayPayment } from "../services/portfolio";

// Utility functions
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

// Returns the age in years of a NAV date string in "DD-MM-YYYY" format.
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

// Generate dummy pie chart data for simulated asset allocation
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

export default function MutualFunds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [funds, setFunds] = useState({ active: [], historical: [] });
  const [activeTab, setActiveTab] = useState("active"); // "active" | "historical"
  const [tabCounts, setTabCounts] = useState({ active: 0, historical: 0 });
  const [selectedSchemeCode, setSelectedSchemeCode] = useState(searchParams.get("scheme") || "");
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);

  const [portfolioHoldings, setPortfolioHoldings] = useState([]);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState("buy"); // 'buy' or 'sell'
  const [txAmount, setTxAmount] = useState("");
  const [txDuration, setTxDuration] = useState("12"); // default 12 months for SIP
  const [isSipSelected, setIsSipSelected] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txMessage, setTxMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== query) {
      setTimeout(() => setQuery(q), 0);
    }
  }, [searchParams]);

  useEffect(() => {
    // Fetch portfolio to know holdings for Sell button
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
    const params = {};
    const trimmedQuery = query.trim();
    if (trimmedQuery) params.q = trimmedQuery;
    if (selectedSchemeCode) params.scheme = selectedSchemeCode;
    setSearchParams(params, { replace: true });
  }, [query, selectedSchemeCode, setSearchParams]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 1) {
      setTimeout(() => {
        setFunds([]);
        setListLoading(false);
      }, 0);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const loadFunds = async () => {
      setListLoading(true);
      try {
        const response = trimmedQuery.length >= 2
          ? await searchMutualFunds({ q: trimmedQuery, limit: 16, signal: controller.signal })
          : await listMutualFunds({ limit: 12, offset: 0, signal: controller.signal });

        if (!active) return;

        const activeList    = Array.isArray(response?.active)    ? response.active    : [];
        const historicalList = Array.isArray(response?.historical) ? response.historical : [];
        setFunds({ active: activeList, historical: historicalList });
        setTabCounts(response?.counts ?? { active: activeList.length, historical: historicalList.length });

        // Auto-select: pick from whichever tab is currently shown
        const currentList = activeTab === "active" ? activeList : historicalList;
        const hasSelected = currentList.some((f) => String(f.schemeCode) === String(selectedSchemeCode));
        if ((!selectedSchemeCode || (trimmedQuery.length >= 2 && !hasSelected)) && currentList[0]) {
          setSelectedSchemeCode(String(currentList[0].schemeCode));
        }
      } catch (error) {
        if (error?.name !== "CanceledError") {
          setFunds({ active: [], historical: [] });
          setTabCounts({ active: 0, historical: 0 });
        }
      } finally {
        if (active) setListLoading(false);
      }
    };

    const timeoutId = setTimeout(loadFunds, trimmedQuery ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selectedSchemeCode) {
      setTimeout(() => setSelectedFund(null), 0);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const loadFundDetails = async () => {
      setDetailLoading(true);
      try {
        const response = await getMutualFundDetails(selectedSchemeCode, { signal: controller.signal });
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
  }, [selectedSchemeCode]);

  const chartData = useMemo(() => {
    if (!selectedFund?.data) return [];
    // To prevent Recharts from lagging with 5000+ points, we can sample the data for MAX view
    // if there's a lot of data, we take roughly 1 point per week
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

  const displayedFunds = useMemo(
    () => (activeTab === "active" ? funds.active : funds.historical) ?? [],
    [activeTab, funds]
  );

  const pieData = useMemo(() => {
    return generatePieData(selectedFund?.meta?.scheme_category);
  }, [selectedFund]);

  const handleTransaction = async (e) => {
    e.preventDefault();

    if (!latestNav || latestNav <= 0) {
      setTxMessage({
        type: 'error',
        text: 'Live NAV data is unavailable for this scheme. Transaction cannot proceed.'
      });
      return;
    }

    setTxLoading(true);
    setTxMessage(null);
    try {
      const payload = {
        schemeCode: Number(selectedSchemeCode),
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
          // Razorpay flow for Lumpsum
          const order = await createRazorpayOrder(Number(txAmount));
          
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Snsc6Pg1LbIYVH", // Enter the Key ID generated from the Dashboard
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
                  schemeCode: payload.schemeCode,
                  schemeName: payload.schemeName,
                  amount: payload.amount,
                  nav: payload.nav,
                });
                
                setTxMessage({ type: 'success', text: `Successfully bought ${payload.schemeName}` });
                setShowTxModal(false);
                setShowSuccessModal(true);
                
                // Refresh portfolio
                const data = await getPortfolio();
                if (data && data.holdings) setPortfolioHoldings(data.holdings);
              } catch (err) {
                console.error("Verification failed", err);
                setTxMessage({ type: 'error', text: "Payment verification failed" });
              }
            },
            prefill: {
              name: "Investor",
              email: "investor@example.com",
              contact: "9999999999"
            },
            theme: {
              color: "#3b82f6"
            }
          };
          
          const rzp1 = new window.Razorpay(options);
          rzp1.on('payment.failed', function (response){
            console.error(response.error);
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

      // Refresh portfolio holdings
      const data = await getPortfolio();
      if (data && data.holdings) setPortfolioHoldings(data.holdings);
    } catch (err) {
      setTxMessage({
        type: 'error',
        text: err.response?.data?.message || `Failed to ${txType} fund.`
      });
    } finally {
      setTxLoading(false);
    }
  };

  const hasHolding = portfolioHoldings.some(h => String(h.schemeCode) === String(selectedSchemeCode));
  const currentHolding = portfolioHoldings.find(h => String(h.schemeCode) === String(selectedSchemeCode)) ?? null;
  const latestNavRaw = parseNumber(selectedFund?.data?.[0]?.nav);
  const latestNav = latestNavRaw && latestNavRaw > 0 ? latestNavRaw : 0;

  // Detect inactive / archived funds: latest NAV date is older than 3 years
  const latestNavDate = selectedFund?.data?.[0]?.date ?? selectedFund?.latest?.date;
  const navAgeYears = getNavAgeYears(latestNavDate);
  const isInactive = navAgeYears > 3;
  
  const performanceMetrics = useMemo(() => {
    if (!selectedFund?.data || selectedFund.data.length < 2) {
      return { _1y: "--", _3y: "--", _5y: "--", navChange: "--", isNavChangePositive: true };
    }
    
    const data = selectedFund.data;
    const latestNavCalc = parseNumber(data[0].nav);
    const prevNavCalc = parseNumber(data[1].nav);
    
    if (!latestNavCalc || !prevNavCalc) return { _1y: "--", _3y: "--", _5y: "--", navChange: "--", isNavChangePositive: true };

    const navChangePercent = ((latestNavCalc - prevNavCalc) / prevNavCalc) * 100;
    const isNavChangePositive = navChangePercent >= 0;
    const navChangeStr = `${isNavChangePositive ? '+' : ''}${navChangePercent.toFixed(2)}%`;

    const getNavAtDaysAgo = (days) => {
      const [d, m, y] = data[0].date.split('-');
      const targetDate = new Date(y, m - 1, d);
      targetDate.setDate(targetDate.getDate() - days);
      
      let closestNav = null;
      let minDiff = Infinity;
      
      for (let entry of data) {
        const [ed, em, ey] = entry.date.split('-');
        const entryDate = new Date(ey, em - 1, ed);
        const diff = Math.abs(targetDate - entryDate);
        if (diff < minDiff) {
          minDiff = diff;
          closestNav = parseNumber(entry.nav);
        }
      }
      
      if (minDiff <= 15 * 24 * 60 * 60 * 1000 && closestNav) {
        return closestNav;
      }
      return null;
    };

    const calcCagr = (navAtDate, years) => {
      if (!navAtDate) return "--";
      const cagr = (Math.pow(latestNavCalc / navAtDate, 1 / years) - 1) * 100;
      return `${cagr >= 0 ? '+' : ''}${cagr.toFixed(2)}%`;
    };

    return {
      _1y: calcCagr(getNavAtDaysAgo(365), 1),
      _3y: calcCagr(getNavAtDaysAgo(3 * 365), 3),
      _5y: calcCagr(getNavAtDaysAgo(5 * 365), 5),
      navChange: navChangeStr,
      isNavChangePositive
    };
  }, [selectedFund]);

  const { navChange, isNavChangePositive } = performanceMetrics;

  return (
    <div className="w-full h-full bg-[#0B1120] text-slate-200 flex flex-col font-sans overflow-hidden">
      <div className="flex-1 w-full max-w-[100rem] mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* LEFT PANEL: Search and List */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col bg-[#111827]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          {/* Search header */}
          <div className="p-5 border-b border-slate-800/80 bg-[#1e293b]/30">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="text-blue-500 fill-blue-500/20" size={20} />
              Discover Funds
            </h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by AMC, scheme name..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1120] border border-slate-700/50 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Active / Historical tabs */}
          <div className="flex border-b border-slate-800/80 shrink-0">
            {[
              { id: "active",     label: "Active",     count: tabCounts.active },
              { id: "historical", label: "Historical",  count: tabCounts.historical },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Auto-select first fund in the new tab
                  const list = tab.id === "active" ? funds.active : funds.historical;
                  if (list?.[0]) setSelectedSchemeCode(String(list[0].schemeCode));
                }}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-all relative ${
                  activeTab === tab.id
                    ? tab.id === "active"
                      ? "text-blue-400"
                      : "text-amber-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    activeTab === tab.id
                      ? tab.id === "active" ? "bg-blue-500/20 text-blue-300" : "bg-amber-500/20 text-amber-300"
                      : "bg-slate-800 text-slate-500"
                  }`}>
                    {tabCounts[tab.id]}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    tab.id === "active" ? "bg-blue-500" : "bg-amber-500"
                  }`} />
                )}
              </button>
            ))}
          </div>

          {/* Fund list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {listLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-800/50 h-20 rounded-xl"></div>
                ))}
              </div>
            ) : displayedFunds.length > 0 ? (
              displayedFunds.map(fund => {
                const isSelected = String(fund.schemeCode) === selectedSchemeCode;
                return (
                  <button
                    key={fund.schemeCode}
                    onClick={() => setSelectedSchemeCode(String(fund.schemeCode))}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                      isSelected
                        ? activeTab === "active"
                          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          : "bg-gradient-to-r from-amber-600/15 to-orange-600/10 border-amber-500/40"
                        : "bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-700/50"
                    } border`}
                  >
                    {isSelected && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                        activeTab === "active" ? "bg-blue-500" : "bg-amber-500"
                      }`} />
                    )}
                    <h4 className={`font-semibold text-sm line-clamp-2 leading-snug mb-1.5 transition-colors ${
                      isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}>
                      {fund.schemeName}
                    </h4>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-500 font-medium">CODE: {fund.schemeCode}</p>
                      {activeTab === "historical" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ARCHIVED
                        </span>
                      )}
                      {activeTab === "active" && (
                        <ArrowRight size={14} className={`transition-transform duration-300 ${
                          isSelected ? "text-blue-400 translate-x-0 opacity-100" : "-translate-x-2 opacity-0 text-slate-600 group-hover:opacity-100 group-hover:translate-x-0"
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                <Search size={32} className="mb-3 opacity-20" />
                <p className="text-sm">
                  {activeTab === "active" ? "No active funds found." : "No archived mutual funds found."}
                </p>
                <p className="text-xs mt-1 opacity-60">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Details */}
        <div className="flex-1 flex flex-col min-h-0 gap-4 lg:gap-6">
          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center bg-[#111827]/80 rounded-2xl border border-slate-800/80">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedFund ? (
            <>
              {/* HERO CARD */}
              <div className={`shrink-0 backdrop-blur-md rounded-2xl p-5 lg:p-6 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                isInactive
                  ? 'bg-[#111827]/70 border border-amber-900/40'
                  : 'bg-[#111827]/90 border border-slate-700/50'
              }`}>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border shrink-0 ${
                    isInactive
                      ? 'bg-gradient-to-br from-slate-600 to-slate-700 border-white/5'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-600 border-white/10'
                  }`}>
                    {isInactive ? <Archive size={28} className="text-amber-400/80" /> : (selectedFund.meta.fund_house?.charAt(0) || 'F')}
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2 leading-tight pr-4">
                      {selectedFund.meta.scheme_name}
                    </h2>
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

                <div className="relative z-10 flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-8 bg-[#0B1120]/50 p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">
                      {isInactive ? 'Last Known NAV' : 'Latest NAV'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      {isInactive ? (
                        <span className="text-lg font-bold text-amber-400/80">Historical NAV Only</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-white">{formatNavValue(latestNav)}</span>
                          <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded ${isNavChangePositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {isNavChangePositive ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>} {navChange}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isInactive ? `Last updated: ${formatNavDate(latestNavDate)}` : `As of ${formatNavDate(selectedFund?.data?.[0]?.date)}`}
                    </p>
                  </div>

                  <div className="hidden lg:block w-px h-12 bg-slate-800"></div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                    {isInactive ? (
                      <div className="group relative">
                        <button
                          disabled
                          className="w-full lg:w-36 px-4 py-2 bg-slate-700/50 text-slate-500 rounded-lg text-sm font-semibold cursor-not-allowed flex justify-center items-center gap-2 border border-slate-700/50"
                        >
                          <Wallet size={16}/> Invest
                        </button>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-slate-900 text-amber-300 text-[10px] font-medium px-3 py-2 rounded-lg border border-amber-500/20 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                          Investments unavailable for inactive mutual fund schemes.
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => {setTxType('buy'); setShowTxModal(true)}} className="w-full lg:w-28 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2">
                          <Wallet size={16}/> Invest
                        </button>
                        {hasHolding && (
                          <button onClick={() => {setTxType('sell'); setShowTxModal(true)}} className="w-full lg:w-28 px-4 py-2 bg-transparent border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg text-sm font-semibold transition-all">
                            Redeem
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>



              {/* MIDDLE ROW */}
              <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
                {/* Chart Section */}
                <div className="flex-[2] bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-xl min-h-[300px]">
                  <h3 className="text-sm uppercase tracking-wider font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <Activity size={16} className={isInactive ? 'text-amber-400' : 'text-blue-500'} />
                    {isInactive ? 'Historical Performance' : 'Performance History'}
                    {isInactive && (
                      <span className="ml-auto text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">ARCHIVED</span>
                    )}
                  </h3>
                  <div className="flex-1 w-full min-h-0 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                        <defs>
                          <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                          itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                          formatter={(value) => [`₹${value}`, 'NAV']}
                        />
                        <Area type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0B1120', strokeWidth: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Allocation Section */}
                <div className="flex-1 bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 flex flex-col shadow-xl min-h-[300px]">
                  <h3 className="text-sm uppercase tracking-wider font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <PieChartIcon size={16} className="text-emerald-400" />
                    Asset Allocation
                  </h3>
                  <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={70}
                          stroke="rgba(15,23,42,0.8)"
                          strokeWidth={2}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px'}} 
                          itemStyle={{color: '#f8fafc', fontWeight: 'bold'}} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total</span>
                      <span className="text-xl font-bold text-white">100%</span>
                    </div>
                  </div>
                  <div className="shrink-0 space-y-2 mt-4 bg-[#0B1120]/50 p-3 rounded-xl border border-slate-800">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-[11px] font-semibold">
                        <div className="flex items-center gap-2 text-slate-300">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                          {d.name}
                        </div>
                        <div className="text-slate-100">{d.value}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 min-h-[160px]">
                
                {/* Fund Information */}
                <div className="md:col-span-2 bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col justify-center">
                  <h3 className="text-sm uppercase tracking-wider font-bold text-slate-300 mb-6 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-400" />
                    Fund Information
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                    <div><div className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Scheme Code</div><div className="text-slate-200 font-bold text-sm">{selectedFund.meta.scheme_code}</div></div>
                    <div><div className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Category</div><div className="text-slate-200 font-bold text-sm truncate" title={selectedFund.meta.scheme_category}>{selectedFund.meta.scheme_category}</div></div>
                    <div><div className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Type</div><div className="text-slate-200 font-bold text-sm">{selectedFund.meta.scheme_type || 'Open Ended'}</div></div>
                    <div><div className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Fund House</div><div className="text-slate-200 font-bold text-sm truncate" title={selectedFund.meta.fund_house}>{selectedFund.meta.fund_house}</div></div>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="md:col-span-1 bg-gradient-to-br from-[#1e1b4b] to-[#111827] border border-purple-500/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] pointer-events-none rounded-full"></div>
                  <h3 className="text-sm uppercase tracking-wider font-bold text-purple-300 mb-3 flex items-center gap-2 relative z-10">
                    <Sparkles size={16} className="text-purple-400" />
                    AI Insight
                  </h3>
                  <p className="text-[11px] text-purple-100/70 leading-relaxed relative z-10 flex-1">
                    This <span className="text-purple-200 font-semibold">{selectedFund.meta.scheme_category}</span> fund exhibits characteristic volatility but offers strong potential for long-term wealth creation. It maintains a well-balanced portfolio, making it ideal for investors with a 5+ year horizon seeking alpha generation against benchmarks.
                  </p>
                </div>

              </div>
            </>
          ) : null}

        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showTxModal && (
          <motion.div 
            initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{scale: 0.95, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 20}}
              className="bg-[#111827] border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-6">
                <button
                  onClick={() => setShowTxModal(false)}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>

                <h3 className="text-2xl font-bold text-white mb-1">
                  {txType === 'buy' ? (isSipSelected ? 'Start SIP' : 'Buy Lumpsum') : 'Redeem Mutual Fund'}
                </h3>
                <p className="text-xs font-medium text-slate-400 mb-6 bg-slate-800/50 inline-block px-3 py-1.5 rounded-lg border border-slate-700/50">
                  {selectedFund?.meta?.scheme_name}
                </p>

                {txType === 'buy' && (
                  <div className="flex bg-[#0B1120] p-1.5 rounded-xl mb-6 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsSipSelected(false)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${!isSipSelected ? 'bg-blue-600 shadow-md text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Lumpsum
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSipSelected(true)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${isSipSelected ? 'bg-blue-600 shadow-md text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      SIP
                    </button>
                  </div>
                )}

                {txMessage && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border ${txMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {txMessage.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <ShieldAlert className="shrink-0 mt-0.5" size={18} />}
                    <span>{txMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleTransaction}>
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        required
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        placeholder="5,000"
                        className="w-full pl-8 pr-4 py-3.5 bg-[#0B1120] border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white text-lg font-bold placeholder:text-slate-600 transition-all"
                      />
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <p className="text-[10px] text-slate-500 font-medium">MIN: ₹100</p>
                      <p className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded">NAV: {formatNavValue(latestNav)}</p>
                    </div>

                    {/* Sell All shortcut — only visible in sell mode with an existing holding */}
                    {txType === 'sell' && currentHolding && latestNav > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allUnitsValue = currentHolding.units * latestNav;
                          setTxAmount(String(Math.floor(allUnitsValue)));
                        }}
                        className="mt-3 w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Sell All &nbsp;<span className="opacity-60 font-normal normal-case tracking-normal">{currentHolding.units.toFixed(4)} units · ₹{Math.floor(currentHolding.units * latestNav).toLocaleString('en-IN')}</span>
                      </button>
                    )}
                  </div>

                  {txType === 'buy' && isSipSelected && (
                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Duration
                      </label>
                      <select
                        value={txDuration}
                        onChange={(e) => setTxDuration(e.target.value)}
                        className="w-full px-4 py-3.5 bg-[#0B1120] border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm font-bold transition-all appearance-none"
                      >
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="36">3 Years</option>
                        <option value="60">5 Years</option>
                        <option value="120">10 Years</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={txLoading}
                    className={`w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-lg flex justify-center items-center gap-2 ${txLoading ? 'opacity-70 cursor-not-allowed' : ''
                      } ${txType === 'buy' ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/25' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25'
                      }`}
                  >
                    {txLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        PROCESSING...
                      </span>
                    ) : (
                      `CONFIRM ${txType === 'buy' && isSipSelected ? 'SIP' : txType.toUpperCase()}`
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/90 backdrop-blur-lg">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#111827] border border-slate-700 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)] p-8 max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Order Successful!</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Your <span className="text-white font-semibold">{isSipSelected ? 'SIP' : 'Lumpsum'}</span> investment for <span className="text-white font-semibold">{selectedFund?.meta?.scheme_name}</span> has been processed.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/dashboard-area/portfolio');
                  }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm tracking-wide transition-colors shadow-lg shadow-blue-500/20"
                >
                  GO TO PORTFOLIO
                </button>
                {isSipSelected && (
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate('/dashboard-area/sips');
                    }}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm tracking-wide transition-colors"
                  >
                    MANAGE SIPS
                  </button>
                )}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3.5 text-slate-500 hover:text-slate-300 text-xs font-bold tracking-wider transition-colors uppercase"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
