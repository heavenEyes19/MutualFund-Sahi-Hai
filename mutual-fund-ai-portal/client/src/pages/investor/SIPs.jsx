import { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Play, Pause, Plus, Calendar, TrendingUp, IndianRupee, Clock, Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SIPs = () => {
  const [sips, setSips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculator State
  const [calcAmount, setCalcAmount] = useState(100);
  const [calcFrequency, setCalcFrequency] = useState('Monthly');
  const [calcReturn, setCalcReturn] = useState(8);
  const [calcYears, setCalcYears] = useState(15);
  const [calcView, setCalcView] = useState('Graph'); // 'Graph' or 'Table'
  const fetchSIPs = async () => {
    try {
      const res = await API.get('/sips');
      setSips(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch {
      setError('Failed to fetch SIPs');
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchSIPs(), 0);
  }, []);



  const executeSIP = async (id) => {
    try {
      await API.post(`/sips/${id}/execute`, {});
      fetchSIPs(); // Refresh list
      alert('SIP Executed Successfully! (Simulated month passed)');
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing SIP');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await API.put(`/sips/${id}`, { status: newStatus });
      fetchSIPs();
    } catch {
      alert('Error updating status');
    }
  };

  // Calculator Logic
  const generateCalcData = () => {
    const data = [];
    let periodsPerYear = 12;
    if (calcFrequency === 'Daily') periodsPerYear = 365;
    if (calcFrequency === 'Weekly') periodsPerYear = 52;
    if (calcFrequency === 'Quarterly') periodsPerYear = 4;

    const ratePerPeriod = calcReturn / periodsPerYear / 100;

    for (let i = 1; i <= calcYears; i++) {
      const n = i * periodsPerYear;
      const invested = calcAmount * n;
      const futureValue = ratePerPeriod === 0 
        ? invested 
        : calcAmount * ((Math.pow(1 + ratePerPeriod, n) - 1) * (1 + ratePerPeriod)) / ratePerPeriod;

      data.push({
        year: i,
        invested: Math.round(invested),
        value: Math.round(futureValue)
      });
    }
    return data;
  };

  const calcData = generateCalcData();
  const finalInvested = calcData.length > 0 ? calcData[calcData.length - 1].invested : 0;
  const finalValue = calcData.length > 0 ? calcData[calcData.length - 1].value : 0;
  const finalEarnings = finalValue - finalInvested;

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
            Systematic Investment Plan (SIP)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Automate your investments and build wealth over time.</p>
        </div>
        <button className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 font-medium">
          <Plus size={20} />
          <span>Create SIP</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded shadow-sm border-l-4 border-red-500">
          <p>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active SIPs</p>
            <h3 className="text-2xl font-bold">{sips.filter(s => s.status === 'ACTIVE').length}</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Monthly Investment</p>
            <h3 className="text-2xl font-bold">₹{sips.filter(s => s.status === 'ACTIVE').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-sm text-white flex items-center space-x-4">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm text-emerald-100 font-medium">Upcoming Debits</p>
            <h3 className="text-2xl font-bold">{sips.filter(s => s.status === 'ACTIVE').length > 0 ? "This Week" : "None"}</h3>
          </div>
        </motion.div>
      </div>

      {/* SIP List */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your SIPs</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Fund</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Next Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center">Loading...</td></tr>
                ) : sips.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No SIPs found. Create one to start automating!</td></tr>
                ) : (
                  sips.map((sip) => (
                    <tr key={sip._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 font-medium">{sip.schemeName}</td>
                      <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">₹{sip.amount}</td>
                      <td className="p-4 text-gray-500">{new Date(sip.nextDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sip.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {sip.status}
                        </span>
                      </td>
                      <td className="p-4 flex justify-end space-x-2">
                        {sip.status === 'ACTIVE' ? (
                          <button onClick={() => toggleStatus(sip._id, sip.status)} className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition" title="Pause">
                            <Pause size={18} />
                          </button>
                        ) : (
                          <button onClick={() => toggleStatus(sip._id, sip.status)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="Resume">
                            <Play size={18} />
                          </button>
                        )}
                        <button onClick={() => executeSIP(sip._id)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition" title="Simulate Execution">
                          <TrendingUp size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* SIP Calculator - HDFC Style */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Panel - Inputs */}
        <div className="w-full lg:w-5/12 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
            <Calculator className="mr-3 text-blue-800 dark:text-blue-500" size={28} /> SIP Calculator
          </h3>

          <div className="space-y-6">
            {/* Investment Amount */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input type="number" value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value) || 0)} className="w-full sm:w-32 pl-8 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>

            {/* Investing Frequency */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Investing frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {['Daily', 'Weekly', 'Monthly', 'Quarterly'].map((freq) => (
                  <button key={freq} onClick={() => setCalcFrequency(freq)} className={`py-2 text-sm font-medium rounded-md border transition-colors ${calcFrequency === freq ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Rate of Return */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Rate of Return</label>
                <div className="relative">
                  <input type="number" value={calcReturn} onChange={(e) => setCalcReturn(Number(e.target.value) || 0)} className="w-16 pr-6 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <input type="range" min="1" max="30" step="0.1" value={calcReturn} onChange={(e) => setCalcReturn(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            {/* SIP Duration */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SIP Duration</label>
                <div className="relative">
                  <input type="number" value={calcYears} onChange={(e) => setCalcYears(Number(e.target.value) || 0)} className="w-16 pr-6 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">Y</span>
                </div>
              </div>
              <input type="range" min="1" max="30" step="1" value={calcYears} onChange={(e) => setCalcYears(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          {/* Results Box */}
          <div className="mt-8 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Investment</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{finalInvested.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated Returns</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{finalValue.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800 p-3 text-center border-t border-gray-300 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Your Earnings <span className="font-bold text-gray-900 dark:text-white ml-2">₹{finalEarnings.toLocaleString('en-IN')}</span>
              </p>
            </div>
            <button className="w-full py-4 bg-[#e21b22] hover:bg-red-700 text-white font-bold text-lg uppercase transition-colors">
              Start a SIP
            </button>
          </div>
        </div>

        {/* Right Panel - Graph & Contact */}
        <div className="w-full lg:w-7/12 p-6 lg:p-8 flex flex-col bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex justify-end mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-full flex overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm p-1">
              <button onClick={() => setCalcView('Graph')} className={`px-6 py-1.5 text-sm font-medium rounded-full transition-colors ${calcView === 'Graph' ? 'bg-[#0f172a] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Graph</button>
              <button onClick={() => setCalcView('Table')} className={`px-6 py-1.5 text-sm font-medium rounded-full transition-colors ${calcView === 'Table' ? 'bg-[#0f172a] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Table</button>
            </div>
          </div>

          {calcView === 'Graph' ? (
            <>
              <div className="flex items-center space-x-6 mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#1e3a8a]"></div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">₹{finalInvested.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Investment</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">₹{finalValue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 mt-1">Estimated Returns</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[300px] w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <ResponsiveContainer>
                  <LineChart data={calcData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="year" tickFormatter={(tick) => `${tick}Y`} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                      formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} name="Estimated Returns" />
                    <Line type="monotone" dataKey="invested" stroke="#1e3a8a" strokeWidth={3} dot={false} name="Total Investment" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[350px] bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 shadow-sm">
                  <tr>
                    <th className="p-4 text-sm font-medium text-gray-500">Year</th>
                    <th className="p-4 text-sm font-medium text-gray-500 text-right">Invested</th>
                    <th className="p-4 text-sm font-medium text-gray-500 text-right">Returns</th>
                    <th className="p-4 text-sm font-medium text-gray-500 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {calcData.map((row) => (
                    <tr key={row.year} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 text-sm">{row.year}</td>
                      <td className="p-4 text-sm text-right">₹{row.invested.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-sm text-right text-green-600 dark:text-green-400">+₹{(row.value - row.invested).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-sm font-medium text-right text-gray-900 dark:text-white">₹{row.value.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SIPs;
