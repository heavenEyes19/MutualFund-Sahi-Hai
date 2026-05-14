import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, PlusCircle, MinusCircle, Wallet, Activity, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const getFundCategory = (schemeName) => {
  if (!schemeName) return 'Equity';
  const name = schemeName.toLowerCase();
  if (name.includes('debt') || name.includes('liquid') || name.includes('bond') || name.includes('gilt') || name.includes('fixed')) return 'Debt';
  if (name.includes('hybrid') || name.includes('balanced') || name.includes('dynamic') || name.includes('arbitrage')) return 'Hybrid';
  return 'Equity';
};

const getCategoryBadgeStyles = (category) => {
  switch (category) {
    case 'Equity': return 'bg-[#0088FE]/10 text-[#0088FE] dark:bg-[#0088FE]/20';
    case 'Debt': return 'bg-[#00C49F]/10 text-[#00C49F] dark:bg-[#00C49F]/20';
    case 'Hybrid': return 'bg-[#FFBB28]/10 text-[#FFBB28] dark:bg-[#FFBB28]/20 text-[10px]';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const Portfolio = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    setTimeout(() => fetchPortfolio(), 0);
  }, []);

  const overview = data?.overview || {};
  const holdings = data?.holdings || [];
  const isPositiveReturn = (overview?.totalReturns || 0) >= 0;

  // Dynamic data for charts
  const assetAllocation = React.useMemo(() => {
    if (!holdings || holdings.length === 0) return [];
    const alloc = { Equity: 0, Debt: 0, Hybrid: 0 };
    let total = 0;
    holdings.forEach(h => {
      const cat = getFundCategory(h.schemeName);
      const val = h.currentValue || 0;
      if (alloc[cat] !== undefined) alloc[cat] += val;
      else alloc.Equity += val; // fallback
      total += val;
    });
    if (total === 0) return [];
    return [
      { name: 'Equity', value: Number(((alloc.Equity / total) * 100).toFixed(2)) },
      { name: 'Debt', value: Number(((alloc.Debt / total) * 100).toFixed(2)) },
      { name: 'Hybrid', value: Number(((alloc.Hybrid / total) * 100).toFixed(2)) },
    ].filter(a => a.value > 0);
  }, [holdings]);

  // Mock data for Growth chart (Backend does not track historical portfolio value yet)
  const growthData = [
    { name: 'Jan', invested: 10000, value: 10500 },
    { name: 'Feb', invested: 20000, value: 21500 },
    { name: 'Mar', invested: 30000, value: 31000 },
    { name: 'Apr', invested: 40000, value: 43000 },
    { name: 'May', invested: 50000, value: 55000 },
    { name: 'Jun', invested: overview.totalInvested || 60000, value: overview.currentValue || 68000 },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Your Portfolio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time insights and analytics for your investments.</p>
        </div>
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition-all transform hover:scale-105">
            <PlusCircle size={18} />
            <span>Invest More</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg shadow transition-all transform hover:scale-105">
            <MinusCircle size={18} />
            <span>Redeem</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Total Invested" value={overview.totalInvested} icon={<Wallet />} />
        <Card title="Current Value" value={overview.currentValue} icon={<Activity />} isHighlight />
        <Card
          title="Total Returns"
          value={overview.totalReturns}
          icon={isPositiveReturn ? <TrendingUp /> : <TrendingDown />}
          isPositive={isPositiveReturn}
          subtitle={`${overview.totalReturnsPercent?.toFixed(2)}%`}
        />
        <Card title="Active Holdings" value={holdings.length} icon={<BarChart3 />} textOnly />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-6">Growth Over Time</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="invested" name="Invested" stroke="#6366F1" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="value" name="Current Value" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2 self-start">Asset Allocation</h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Current Holdings</h3>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Fund Name</th>
                <th className="p-4 font-medium">Units</th>
                <th className="p-4 font-medium">Avg NAV</th>
                <th className="p-4 font-medium">Current NAV</th>
                <th className="p-4 font-medium">Current Value</th>
                <th className="p-4 font-medium">Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No holdings found. Start investing!</td>
                </tr>
              ) : (
                holdings.map((fund, idx) => {
                  const category = getFundCategory(fund.schemeName);
                  return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{fund.schemeName}</div>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getCategoryBadgeStyles(category)}`}>
                        {category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{fund.units.toFixed(2)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">₹{fund.avgNav.toFixed(2)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">₹{fund.currentNav?.toFixed(2) || '-'}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">₹{fund.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-max ${fund.gainLossPercent >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {fund.gainLossPercent >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                        {Math.abs(fund.gainLossPercent).toFixed(2)}%
                      </span>
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
  );
};

const Card = ({ title, value, icon, isHighlight, isPositive, subtitle, textOnly }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-6 rounded-2xl shadow-sm border ${isHighlight
        ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-transparent'
        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
        }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-medium mb-1 ${isHighlight ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {title}
          </p>
          <h4 className={`text-3xl font-bold tracking-tight ${isHighlight ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
            {textOnly ? value : `₹${(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </h4>
          {subtitle && (
            <p className={`text-sm mt-2 font-medium flex items-center ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}>
              {isPositive ? '+' : ''}{subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${isHighlight
          ? 'bg-white/20 backdrop-blur-md'
          : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          }`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default Portfolio;
