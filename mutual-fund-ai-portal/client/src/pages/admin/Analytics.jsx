import { BarChart3, Users, Database, AlertCircle, TrendingUp, ArrowUpRight, Activity, Shield, CheckCircle2, Globe, Cpu, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { motion } from 'framer-motion';

const AdminPlatformAnalytics = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Assets',
      value: '₹142.8 Cr',
      sub: '↑ 12% MONTHLY',
      subColor: 'text-emerald-500',
      icon: Database,
      iconClass: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Active Users',
      value: '8.4k',
      sub: '↑ 320 NEW TODAY',
      subColor: 'text-emerald-500',
      icon: Users,
      iconClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Pending KYC',
      value: '24',
      sub: 'REQUIRES ACTION',
      subColor: 'text-rose-500',
      icon: Shield,
      iconClass: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500',
      onClick: () => navigate('/dashboard-area/kyc-management'),
      clickable: true,
    },
    {
      title: 'Uptime Score',
      value: '99.99%',
      sub: 'OPTIMAL HEALTH',
      subColor: 'text-indigo-500',
      icon: Activity,
      iconClass: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
  ];

  const healthItems = [
    { label: 'API Edge Latency', value: '84ms', status: 'good', icon: Zap },
    { label: 'Core DB Pulse', value: '4ms', status: 'good', icon: Cpu },
    { label: 'Error Logs (24h)', value: '0.00%', status: 'good', icon: CheckCircle2 },
    { label: 'Global Availability', value: '99.98%', status: 'good', icon: Globe },
  ];

  return (
    <div className="w-full transition-colors duration-300 font-inter">

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Internal Operations</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Platform Core</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time system telemetry and user distribution.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Mainnet Operational</span>
        </div>
      </header>

      {/* Hero Admin Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[32px] overflow-hidden mb-10 p-8 sm:p-10 bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl shadow-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-400/20 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <Shield size={24} className="text-white" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">System Administrator</p>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Welcome, {user?.name || 'Admin'}</h2>
               </div>
            </div>
            <p className="text-indigo-100/80 font-medium max-w-lg leading-relaxed">
              Platform activity has increased by <span className="text-white font-black">24%</span> in the last 24 hours. You have <span className="text-white font-black">12 new KYC applications</span> awaiting your review.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard-area/kyc-management')}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all shrink-0"
          >
            Access KYC Vault <ArrowUpRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map(({ title, value, sub, subColor, icon: Icon, iconClass, onClick, clickable }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={onClick}
            className={`ui-card p-6 dark:bg-slate-900/50 transition-all group ${
              clickable ? 'cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${iconClass}`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1.5 tabular-nums">{value}</p>
            <div className="flex items-center justify-between">
               <p className={`text-[10px] font-black uppercase tracking-tighter ${subColor}`}>{sub}</p>
               {clickable && <ArrowUpRight size={14} className="text-indigo-500 animate-pulse" />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* System Health */}
        <div className="lg:col-span-5 ui-card p-8 dark:bg-slate-900/40">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-inner">
              <Activity size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">System Telemetry</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Cluster Status</p>
            </div>
          </div>
          <div className="space-y-2">
            {healthItems.map(({ label, value, status, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${status === 'good' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[13px] font-black text-slate-800 dark:text-slate-200">{label}</span>
                </div>
                <span className="text-[13px] font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Vault */}
        <div className="lg:col-span-7 ui-card p-8 dark:bg-slate-900/40">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shadow-inner">
              <Zap size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Operations Vault</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Administrative Controls</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'KYC Vault', sub: '12 new reviews', path: '/dashboard-area/kyc-management', color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', icon: Shield },
              { label: 'Fund Master', sub: 'NAV synchronization', path: '/dashboard-area/fund-master', color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400', icon: Database },
              { label: 'Global Logs', sub: 'Traffic & audit trail', path: '/dashboard-area/analytics', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: BarChart3 },
              { label: 'User Hub', sub: 'RBAC permissions', path: '/dashboard-area/analytics', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: Users },
            ].map(({ label, sub, path, color, icon: Icon }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[28px] hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all group text-left relative overflow-hidden"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-[14px] font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{label}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{sub}</p>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                   <ArrowUpRight size={20} className="text-indigo-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlatformAnalytics;
