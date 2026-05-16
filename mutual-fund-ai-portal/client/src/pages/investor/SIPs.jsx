import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Play, Pause, Plus, Calendar, TrendingUp, IndianRupee, Clock, Calculator, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import KycGuard from '../../components/layout/KycGuard';
import { useKycStatus } from '../../hooks/useKycStatus';
import useDarkMode from '../../hooks/useDarkMode';
import useNotificationStore from '../../store/useNotificationStore';

const SIPs = () => {
  const [sips, setSips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDarkMode] = useDarkMode();
  const { kycStatus, kycRejectionReason, loading: kycLoading } = useKycStatus();
  const navigate = useNavigate();
  const addNotification = useNotificationStore(state => state.addNotification);

  const [calcAmount, setCalcAmount] = useState(5000);
  const [calcFrequency, setCalcFrequency] = useState('Monthly');
  const [calcReturn, setCalcReturn] = useState(12);
  const [calcYears, setCalcYears] = useState(10);
  const [calcView, setCalcView] = useState('Graph');

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

  useEffect(() => { fetchSIPs(); }, []);

  const executeSIP = async (id) => {
    try {
      await API.post(`/sips/${id}/execute`, {});
      fetchSIPs();
      const msg = 'Your SIP instalment has been executed successfully.';
      toast.success(msg, { 
        style: { 
          borderRadius: '12px', 
          background: isDarkMode ? '#1E293B' : '#fff', 
          color: isDarkMode ? '#fff' : '#0f172a' 
        } 
      });
      addNotification({
        _id: `notif-${Date.now()}`,
        title: 'SIP Executed',
        message: msg,
        type: 'sip',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error executing SIP. Please try again.';
      toast.error(errMsg, { 
        style: { 
          borderRadius: '12px', 
          background: isDarkMode ? '#1E293B' : '#fff', 
          color: isDarkMode ? '#fff' : '#0f172a' 
        } 
      });
      addNotification({
        _id: `notif-${Date.now()}`,
        title: 'SIP Execution Failed',
        message: errMsg,
        type: 'error',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await API.put(`/sips/${id}`, { status: newStatus });
      fetchSIPs();
      toast.success(`SIP ${newStatus.toLowerCase()} successfully`, { 
        style: { 
          borderRadius: '12px', 
          background: isDarkMode ? '#1E293B' : '#fff', 
          color: isDarkMode ? '#fff' : '#0f172a' 
        } 
      });
    } catch {
      const errMsg = 'Could not update SIP status. Please try again.';
      toast.error(errMsg, { 
        style: { 
          borderRadius: '12px', 
          background: isDarkMode ? '#1E293B' : '#fff', 
          color: isDarkMode ? '#fff' : '#0f172a' 
        } 
      });
      addNotification({
        _id: `notif-${Date.now()}`,
        title: 'Update Failed',
        message: errMsg,
        type: 'error',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

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
      const futureValue = ratePerPeriod === 0 ? invested : calcAmount * ((Math.pow(1 + ratePerPeriod, n) - 1) * (1 + ratePerPeriod)) / ratePerPeriod;
      data.push({ year: i, invested: Math.round(invested), value: Math.round(futureValue) });
    }
    return data;
  };

  const calcData = generateCalcData();
  const finalInvested = calcData.length > 0 ? calcData[calcData.length - 1].invested : 0;
  const finalValue = calcData.length > 0 ? calcData[calcData.length - 1].value : 0;
  const finalEarnings = finalValue - finalInvested;

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Loading Automation Hub…</p>
      </div>
    </div>
  );

  return (
    <KycGuard kycStatus={kycStatus} kycRejectionReason={kycRejectionReason} loading={kycLoading}>
      <div className="w-full transition-colors duration-300 font-inter">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">SIP Automation</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Wealth creation through systematic discipline.</p>
          </div>
          <button onClick={() => navigate('/dashboard-area/mutual-funds')}
            className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:-translate-y-1 active:translate-y-0 transition-all">
            <Plus size={18} /> Setup New SIP
          </button>
        </div>

        {error && <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 p-4 mb-8 rounded-2xl text-xs font-bold">{error}</div>}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Active SIPs', value: sips.filter(s => s.status === 'ACTIVE').length, icon: Calendar, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
            { label: 'Total Committed', value: `₹${sips.filter(s => s.status === 'ACTIVE').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
            { label: 'Next Execution', value: sips.filter(s => s.status === 'ACTIVE').length > 0 ? "This Week" : "None", icon: Clock, color: 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              whileHover={{ y: -4 }} 
              className={`ui-card p-6 flex items-center gap-5 ${i === 2 ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-transparent' : 'dark:bg-slate-900/50'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${i === 2 ? 'bg-white/10 border border-white/20 shadow-inner' : stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${i === 2 ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>{stat.label}</p>
                <h3 className={`text-2xl font-black tracking-tight ${i === 2 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SIP List */}
        <div className="ui-card overflow-hidden mb-10 dark:bg-slate-900/40">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Active Mandates</h3>
             <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">Manage Bank</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Fund Scheme</th>
                  <th className="px-6 py-4">Monthly SIP</th>
                  <th className="px-6 py-4">Next Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sips.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active SIP mandates found.</td></tr>
                ) : (
                  sips.map((sip) => (
                    <tr key={sip._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900 dark:text-white text-[13px] leading-tight">{sip.schemeName}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Automated via OTM</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">₹{sip.amount.toLocaleString()}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">{new Date(sip.nextDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${sip.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                          {sip.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => toggleStatus(sip._id, sip.status)} className={`p-2.5 rounded-xl transition-all ${sip.status === 'ACTIVE' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100'}`} title={sip.status === 'ACTIVE' ? 'Pause' : 'Resume'}>
                            {sip.status === 'ACTIVE' ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <button onClick={() => executeSIP(sip._id)} className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" title="Simulate Debit">
                            <TrendingUp size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIP Calculator - Redesigned */}
        <div className="ui-card overflow-hidden dark:bg-slate-900/40 flex flex-col lg:flex-row">
          
          <div className="w-full lg:w-5/12 p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shadow-inner">
                <Calculator size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Growth Simulator</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan your retirement</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Investment</label>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{calcAmount.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="100000" step="500" value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Frequency</label>
                 <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    {['Weekly', 'Monthly', 'Quarterly'].map(f => (
                      <button key={f} onClick={() => setCalcFrequency(f)} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${calcFrequency === f ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}>
                        {f}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Returns</label>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{calcReturn}%</span>
                  </div>
                  <input type="range" min="1" max="30" step="1" value={calcReturn} onChange={(e) => setCalcReturn(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Time</label>
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400">{calcYears}Y</span>
                  </div>
                  <input type="range" min="1" max="40" step="1" value={calcYears} onChange={(e) => setCalcYears(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                </div>
              </div>

              <div className="pt-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Invested</p>
                       <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">₹{finalInvested.toLocaleString()}</p>
                     </div>
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Value</p>
                       <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">₹{finalValue.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20">
                     <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Wealth Gained</span>
                     <span className="text-sm font-black text-white tabular-nums">₹{finalEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-7/12 p-8 sm:p-10 flex flex-col bg-slate-50/20 dark:bg-slate-900/10">
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</span>
                  </div>
               </div>
               <div className="flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
                  {['Graph', 'Table'].map(v => (
                    <button key={v} onClick={() => setCalcView(v)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${calcView === v ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}>
                      {v}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex-1">
              {calcView === 'Graph' ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <AreaChart data={calcData}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.05)" />
                      <XAxis dataKey="year" tickFormatter={(t) => `${t}Y`} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '16px', backdropFilter: 'blur(8px)' }} 
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#6366f1', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" name="Total Value" />
                      <Area type="monotone" dataKey="invested" stroke="#e2e8f0" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Invested" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-xl overflow-hidden max-h-[440px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b border-slate-100 dark:border-slate-700">
                        <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <th className="px-6 py-4">Year</th>
                          <th className="px-6 py-4 text-right">Invested</th>
                          <th className="px-6 py-4 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {calcData.map(row => (
                          <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-[13px] font-black text-slate-900 dark:text-white">{row.year}Y</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-500 text-right tabular-nums">₹{row.invested.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 text-right tabular-nums">₹{row.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </KycGuard>
  );
};

export default SIPs;
