import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Play, Pause, StopCircle, Plus, Calendar, TrendingUp, IndianRupee, Clock, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SIPs = () => {
  const [sips, setSips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculator State
  const [calcAmount, setCalcAmount] = useState(5000);
  const [calcYears, setCalcYears] = useState(10);
  const [calcReturn, setCalcReturn] = useState(12);

  useEffect(() => {
    fetchSIPs();
  }, []);

  const fetchSIPs = async () => {
    try {
      const res = await API.get('/sips');
      setSips(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch SIPs');
      setLoading(false);
    }
  };

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
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Calculator Logic
  const generateCalcData = () => {
    const data = [];
    const monthlyRate = calcReturn / 12 / 100;
    const months = calcYears * 12;

    let invested = 0;
    let futureValue = 0;

    for (let i = 1; i <= calcYears; i++) {
      invested = calcAmount * 12 * i;
      // FV = P * [ (1+r)^n - 1 ] * (1+r) / r
      const n = i * 12;
      futureValue = calcAmount * ((Math.pow(1 + monthlyRate, n) - 1) * (1 + monthlyRate)) / monthlyRate;

      data.push({
        year: `Year ${i}`,
        invested: Math.round(invested),
        value: Math.round(futureValue)
      });
    }
    return data;
  };

  const calcData = generateCalcData();
  const finalInvested = calcData[calcData.length - 1]?.invested || 0;
  const finalValue = calcData[calcData.length - 1]?.value || 0;

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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* SIP List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
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

        {/* SIP Calculator */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <TrendingUp className="mr-2 text-emerald-500" size={20} /> SIP Calculator
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="flex justify-between text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">
                <span>Monthly Investment</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{calcAmount}</span>
              </label>
              <input type="range" min="500" max="50000" step="500" value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">
                <span>Expected Return (p.a)</span>
                <span className="font-bold text-gray-900 dark:text-white">{calcReturn}%</span>
              </label>
              <input type="range" min="1" max="30" step="0.5" value={calcReturn} onChange={(e) => setCalcReturn(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">
                <span>Time Period (Years)</span>
                <span className="font-bold text-gray-900 dark:text-white">{calcYears} Yrs</span>
              </label>
              <input type="range" min="1" max="30" step="1" value={calcYears} onChange={(e) => setCalcYears(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-6 flex justify-between items-center border border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Value</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{finalValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Invested Amount</p>
              <p className="text-md font-semibold text-gray-700 dark:text-gray-300">₹{finalInvested.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer>
              <AreaChart data={calcData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="year" hide />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }} />
                <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorValue)" />
                <Area type="monotone" dataKey="invested" stroke="#6B7280" fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIPs;
