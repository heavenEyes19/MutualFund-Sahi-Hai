import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, Info, ShieldAlert, CheckCircle2, Wallet, X, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
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
import { getPortfolio, buyFund, sellFund, createSIP } from "../services/portfolio";

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
  if (parsedValue === null) return "--";
  return `₹${parsedValue.toFixed(4)}`;
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
      { name: 'Cash', value: 10, color: '#f59e0b' }
    ];
  }
  return [
    { name: 'Large Cap', value: 50, color: '#3b82f6' },
    { name: 'Mid Cap', value: 30, color: '#8b5cf6' },
    { name: 'Small Cap', value: 15, color: '#ec4899' },
    { name: 'Cash', value: 5, color: '#f59e0b' }
  ];
};

export default function MutualFunds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [funds, setFunds] = useState([]);
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

  const [showAIPopup, setShowAIPopup] = useState(false);
  const navigate = useNavigate();

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
      setFunds([]);
      setListLoading(false);
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
        
        const nextFunds = Array.isArray(response?.schemes) ? response.schemes : [];
        setFunds(nextFunds);
        
        const hasSelectedFund = nextFunds.some((f) => String(f.schemeCode) === String(selectedSchemeCode));
        if ((!selectedSchemeCode || (trimmedQuery.length >= 2 && !hasSelectedFund)) && nextFunds[0]) {
          setSelectedSchemeCode(String(nextFunds[0].schemeCode));
        }
      } catch (error) {
        if (error?.name !== "CanceledError") {
          setFunds([]);
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
      setSelectedFund(null);
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
    return selectedFund.data
      .slice(0, 30)
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
        } else {
          await buyFund(payload);
          setTxMessage({ type: 'success', text: `Successfully bought ${payload.schemeName}` });
        }
        
        setShowTxModal(false);
        setShowSuccessModal(true);
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
  const latestNav = parseNumber(selectedFund?.data?.[0]?.nav) || 100;

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4 lg:p-8 max-w-[90rem] mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mutual Funds Listing</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover and manage mutual fund investments.</p>
          </div>
        </div>

      {/* AI Insights Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowAIPopup(true)}
        className="mb-8 p-5 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl shadow-xl flex items-center justify-between border border-indigo-800 relative overflow-hidden cursor-pointer hover:shadow-indigo-500/20 transition-shadow group"
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-500 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-500 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>

        <div className="flex items-center space-x-4 z-10">
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
            <Sparkles className="text-indigo-300" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">AI Fund Recommendations 🔥</h3>
            <p className="text-indigo-200 text-sm">
              Click here to see today's top picks powered by our advanced AI advisory engine.
            </p>
          </div>
        </div>
        <div className="z-10 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm">
          View Picks
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by AMC, scheme name..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col min-h-[500px] max-h-[800px]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Schemes</span>
              <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                {funds.length} found
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {listLoading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
              ) : funds.length > 0 ? (
                funds.map(fund => {
                  const isSelected = String(fund.schemeCode) === selectedSchemeCode;
                  return (
                    <button
                      key={fund.schemeCode}
                      onClick={() => setSelectedSchemeCode(String(fund.schemeCode))}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      } border`}
                    >
                      <h4 className={`font-semibold text-sm line-clamp-2 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {fund.schemeName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code: {fund.schemeCode}</p>
                    </button>
                  )
                })
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Info className="mx-auto mb-2 opacity-50" size={24} />
                  <p>No schemes found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center min-h-[500px] flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">Loading details...</span>
            </div>
          ) : selectedFund ? (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getSchemeBadges(selectedFund.meta.scheme_name).map(b => (
                        <span key={b} className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {b}
                        </span>
                      ))}
                      <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        {selectedFund.meta.scheme_category}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedFund.meta.scheme_name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fund House: {selectedFund.meta.fund_house}</p>
                  </div>
                  
                  <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 min-w-[140px] text-center border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Latest NAV</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatNavValue(latestNav)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      As of {formatNavDate(selectedFund.data[0]?.date)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 relative z-10">
                  <button 
                    onClick={() => { setTxType('buy'); setShowTxModal(true); }}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Wallet size={18} />
                    Buy Fund
                  </button>
                  {hasHolding && (
                    <button 
                      onClick={() => { setTxType('sell'); setShowTxModal(true); }}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-white dark:bg-gray-800 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <TrendingDown size={18} />
                      Sell Fund
                    </button>
                  )}
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NAV Chart */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    NAV History (30 Days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#6B7280', fontSize: 12 }} 
                          tickLine={false} 
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tick={{ fill: '#6B7280', fontSize: 12 }} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`₹${value}`, 'NAV']}
                        />
                        <Line type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Simulated Asset Allocation */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <PieChart size={20} className="text-purple-500" />
                    Asset Allocation (Simulated)
                  </h3>
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => [`${value}%`, 'Allocation']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">100%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                        {d.name} ({d.value}%)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
              <Search className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Scheme</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Search and select a mutual fund scheme from the list on the left to view detailed NAV history and analytics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Buy/Sell Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="p-6">
              <button 
                onClick={() => setShowTxModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
                {txType === 'buy' ? (isSipSelected ? 'Start SIP' : 'Buy Lumpsum') : 'Sell Mutual Fund'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-1">
                {selectedFund?.meta?.scheme_name}
              </p>

              {txType === 'buy' && (
                <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => setIsSipSelected(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isSipSelected ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    Lumpsum
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSipSelected(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isSipSelected ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    SIP
                  </button>
                </div>
              )}

              {txMessage && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                  txMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {txMessage.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <ShieldAlert className="shrink-0 mt-0.5" size={18} />}
                  <span className="text-sm font-medium">{txMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleTransaction}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 5000)"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white text-lg font-medium"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                    <span>Min: ₹100</span>
                    <span>Current NAV: {formatNavValue(latestNav)}</span>
                  </p>
                </div>

                {txType === 'buy' && isSipSelected && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (Months)
                    </label>
                    <select
                      value={txDuration}
                      onChange={(e) => setTxDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white text-lg font-medium"
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
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-lg transition-colors flex justify-center items-center gap-2 ${
                    txLoading ? 'opacity-70 cursor-not-allowed' : ''
                  } ${
                    txType === 'buy' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {txLoading ? 'Processing...' : `Confirm ${txType === 'buy' && isSipSelected ? 'SIP' : txType.toUpperCase()}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Successful!</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Your {isSipSelected ? 'SIP' : 'Lumpsum'} investment order for {selectedFund?.meta?.scheme_name} has been processed successfully.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/dashboard-area/portfolio');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Go to Portfolio
              </button>
              {isSipSelected && (
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/dashboard-area/sips');
                  }}
                  className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-semibold transition-colors"
                >
                  Manage SIPs
                </button>
              )}
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showAIPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900/30 w-full max-w-2xl overflow-hidden relative"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
              <button 
                onClick={() => setShowAIPopup(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={28} className="text-yellow-300" />
                <h2 className="text-2xl font-bold">Today's Top Picks</h2>
              </div>
              <p className="text-indigo-100">
                AI-curated mutual fund recommendations for {new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(new Date())}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {[
                { name: "Parag Parikh Flexi Cap", category: "Flexi Cap", rationale: "Consistent alpha generation across market cycles with downside protection.", cagr: "18.4%" },
                { name: "Nippon India Small Cap", category: "Small Cap", rationale: "Excellent stock picking in the small-cap space with high growth potential.", cagr: "24.1%" },
                { name: "Quant Active", category: "Multi Cap", rationale: "Dynamic asset allocation strategy capturing momentum effectively.", cagr: "21.8%" }
              ].map((fund, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setQuery(fund.name);
                    setShowAIPopup(false);
                  }}
                  className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{fund.name}</h4>
                    </div>
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full mb-2">
                      {fund.category}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {fund.rationale}
                    </p>
                  </div>
                  <div className="md:border-l md:border-gray-200 dark:md:border-gray-600 md:pl-6 text-left md:text-center shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">3Y CAGR</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fund.cagr}</p>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center italic bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                Disclaimer: Mutual fund investments are subject to market risks. Read all scheme related documents carefully. These AI-generated suggestions do not constitute financial advice.
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
}
