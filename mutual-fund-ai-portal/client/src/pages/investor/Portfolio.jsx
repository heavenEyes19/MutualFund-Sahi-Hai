import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, PlusCircle, MinusCircle, Wallet, Activity, BarChart3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KycGuard from '../../components/layout/KycGuard';
import { useKycStatus } from '../../hooks/useKycStatus';
import useDarkMode from '../../hooks/useDarkMode';
import { sellFund } from '../../services/portfolio';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/useNotificationStore';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const getFundCategory = (schemeName) => {
  if (!schemeName) return 'Equity';
  const name = schemeName.toLowerCase();
  if (name.includes('debt') || name.includes('liquid') || name.includes('bond') || name.includes('gilt') || name.includes('fixed')) return 'Debt';
  if (name.includes('hybrid') || name.includes('balanced') || name.includes('dynamic') || name.includes('arbitrage')) return 'Hybrid';
  return 'Equity';
};

const getCategoryBadgeStyles = (category) => {
  switch (category) {
    case 'Equity': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    case 'Debt': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'Hybrid': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
  }
};

const Portfolio = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDarkMode] = useDarkMode();
  const { kycStatus, kycRejectionReason, loading: kycLoading } = useKycStatus();
  const addNotification = useNotificationStore(state => state.addNotification);

  const fetchPortfolio = async () => {
    try {
      const res = await API.get('/portfolio');
      setData(res.data);
      setLoading(false);
    } catch {
      setError('Failed to fetch portfolio data');
      setLoading(false);
    }
  };

  const [sellingFundId, setSellingFundId] = useState(null);
  const [confirmSell, setConfirmSell] = useState(null); // fund object to sell

  const handleSellAll = (fund) => {
    if (!fund.currentNav) {
      toast.error('Cannot sell: Current NAV is unavailable.', {
        style: { borderRadius: '12px', background: isDarkMode ? '#1E293B' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }
      });
      return;
    }
    setConfirmSell(fund);
  };

  const executeSell = async () => {
    const fund = confirmSell;
    setConfirmSell(null);
    setSellingFundId(fund.schemeCode);
    try {
      await sellFund({ schemeCode: fund.schemeCode, schemeName: fund.schemeName, amount: fund.currentValue, nav: fund.currentNav, unitsToSell: fund.units, currentNav: fund.currentNav });
      const msg = `${fund.schemeName} sold successfully! Proceeds credited to wallet.`;
      toast.success(msg, {
        style: { borderRadius: '12px', background: isDarkMode ? '#1E293B' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }
      });
      addNotification({
        _id: `notif-${Date.now()}`,
        title: 'Mutual Fund Sold',
        message: msg,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      });
      fetchPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sell fund.', {
        style: { borderRadius: '12px', background: isDarkMode ? '#1E293B' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }
      });
    } finally {
      setSellingFundId(null);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const overview = data?.overview || {};
  const holdings = data?.holdings || [];
  const isPositiveReturn = (overview?.totalReturns || 0) >= 0;

  const assetAllocation = React.useMemo(() => {
    if (!holdings || holdings.length === 0) return [];
    const alloc = { Equity: 0, Debt: 0, Hybrid: 0 };
    let total = 0;
    holdings.forEach(h => {
      const cat = getFundCategory(h.schemeName);
      const val = h.currentValue || 0;
      if (alloc[cat] !== undefined) alloc[cat] += val; else alloc.Equity += val;
      total += val;
    });
    if (total === 0) return [];
    return [
      { name: 'Equity', value: Number(((alloc.Equity / total) * 100).toFixed(2)) },
      { name: 'Debt', value: Number(((alloc.Debt / total) * 100).toFixed(2)) },
      { name: 'Hybrid', value: Number(((alloc.Hybrid / total) * 100).toFixed(2)) },
    ].filter(a => a.value > 0);
  }, [holdings]);

  const growthData = [
    { name: 'Jan', invested: 10000, value: 10500 },
    { name: 'Feb', invested: 20000, value: 21500 },
    { name: 'Mar', invested: 30000, value: 31000 },
    { name: 'Apr', invested: 40000, value: 43000 },
    { name: 'May', invested: 50000, value: 55000 },
    { name: 'Jun', invested: overview.totalInvested || 60000, value: overview.currentValue || 68000 },
  ];

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Crunching Numbers…</p>
      </div>
    </div>
  );

  return (
    <KycGuard kycStatus={kycStatus} kycRejectionReason={kycRejectionReason} loading={kycLoading}>
      <div className="w-full transition-colors duration-300 font-inter">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Portfolio Engine</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time performance tracking and asset distribution.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/dashboard-area/mutual-funds')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:-translate-y-1 active:translate-y-0 transition-all"
            >
              <PlusCircle size={18} /> Invest
            </button>
            <button 
              onClick={() => document.getElementById('current-holdings')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <MinusCircle size={18} /> Sell
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 p-4 mb-8 rounded-2xl text-xs font-bold">{error}</div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <Card title="Total Invested" value={overview.totalInvested} icon={<Wallet size={20} />} iconClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" />
          <Card title="Market Value" value={overview.currentValue} icon={<Activity size={20} />} isHighlight />
          <Card title="Net Returns" value={overview.totalReturns} icon={isPositiveReturn ? <TrendingUp size={20} /> : <TrendingDown size={20} />} isPositive={isPositiveReturn} subtitle={`${overview.totalReturnsPercent?.toFixed(2)}% ALL TIME`} />
          <Card title="Active Holdings" value={holdings.length} icon={<BarChart3 size={20} />} iconClass="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" textOnly />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 ui-card p-6 sm:p-8 dark:bg-slate-900/40">
            <h3 className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Equity Growth Curve</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <LineChart data={growthData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    tickFormatter={(v) => `₹${v / 1000}k`} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(8px)'
                    }} 
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6366f1', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="invested" 
                    name="Invested" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={false} 
                    activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Market Value" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={false} 
                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="ui-card p-6 sm:p-8 dark:bg-slate-900/40 flex flex-col">
            <h3 className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Asset Allocation</h3>
            <div className="flex-1 flex flex-col justify-center min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={assetAllocation} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={95} 
                    paddingAngle={8} 
                    dataKey="value"
                    stroke="none"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {assetAllocation.map((a, i) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.name}</span>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white ml-auto">{a.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Holdings Table */}
        <div id="current-holdings" className="ui-card overflow-hidden dark:bg-slate-900/40">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Current Holdings</h3>
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
               <ChevronRight size={18} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Fund Scheme</th>
                  <th className="px-6 py-4">Units Owned</th>
                  <th className="px-6 py-4">Avg Cost</th>
                  <th className="px-6 py-4">Market NAV</th>
                  <th className="px-6 py-4">Invested Value</th>
                  <th className="px-6 py-4">Gain/Loss</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {holdings.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active holdings detected.</td></tr>
                ) : (
                  holdings.map((fund, idx) => {
                    const category = getFundCategory(fund.schemeName);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 dark:text-white text-[13px] leading-tight mb-1.5">{fund.schemeName}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] uppercase font-black tracking-widest ${getCategoryBadgeStyles(category)}`}>{category}</span>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">{fund.units.toFixed(3)}</td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">₹{fund.avgNav.toFixed(2)}</td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">₹{fund.currentNav?.toFixed(2) || '-'}</td>
                        <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white tabular-nums">₹{fund.currentValue?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-5">
                          <div className={`flex items-center gap-1.5 font-black text-xs ${fund.gainLossPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {fund.gainLossPercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(fund.gainLossPercent).toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => handleSellAll(fund)} 
                            disabled={sellingFundId === fund.schemeCode}
                            className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                          >
                            {sellingFundId === fund.schemeCode ? 'Processing…' : 'Sell All'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmSell}
        onClose={() => setConfirmSell(null)}
        onConfirm={executeSell}
        title="Sell All Units?"
        message={confirmSell ? `Sell all ${confirmSell.units.toFixed(3)} units of "${confirmSell.schemeName}" at ₹${confirmSell.currentNav?.toFixed(2)} NAV? Proceeds of ₹${confirmSell.currentValue?.toLocaleString('en-IN')} will be credited to your wallet.` : ''}
        confirmLabel="Sell All"
        cancelLabel="Keep Holding"
        variant="danger"
        isLoading={!!sellingFundId}
      />
    </KycGuard>
  );
};

const Card = ({ title, value, icon, iconClass, isHighlight, isPositive, subtitle, textOnly }) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.02 }}
    className={`p-6 rounded-[28px] border transition-all ${isHighlight
      ? 'bg-gradient-to-br from-indigo-600 to-violet-700 border-transparent text-white shadow-2xl shadow-indigo-500/30'
      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/20'}`}
  >
    <div className="flex justify-between items-start mb-6">
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isHighlight ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>{title}</p>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${isHighlight ? 'bg-white/10 border border-white/20' : (iconClass || 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400')}`}>{icon}</div>
    </div>
    <p className={`text-2xl sm:text-3xl font-black tracking-tighter ${isHighlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
      {textOnly ? value : `₹${(value || 0).toLocaleString('en-IN')}`}
    </p>
    {subtitle && (
      <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isHighlight ? 'bg-white/10 text-white' : (isPositive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500')}`}>
         {isPositive ? '+' : ''}{subtitle}
      </div>
    )}
  </motion.div>
);

export default Portfolio;
