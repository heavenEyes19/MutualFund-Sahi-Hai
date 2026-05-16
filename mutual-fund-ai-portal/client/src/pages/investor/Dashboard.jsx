import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, PieChart, Upload, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import kycService from '../../services/kycService';
import API from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const InvestorDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [kycStatus, setKycStatus] = useState('Not Submitted');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [portfolioData, setPortfolioData] = useState(null);
  
  const [formData, setFormData] = useState({
    aadharNumber: '',
    phoneNumber: '',
    panNumber: '',
    panCardPhoto: null,
    submissionPhoto: null
  });

  const fetchPortfolio = async () => {
    try {
      const res = await API.get('/portfolio');
      setPortfolioData(res.data);
    } catch (error) {
      console.error("Error fetching portfolio data", error);
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const data = await kycService.getKYCStatus();
      setKycStatus(data.status);
    } catch (error) {
      console.error("Error fetching KYC status", error);
    }
  };

  useEffect(() => {
    fetchKYCStatus();
    fetchPortfolio();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');
    if (!formData.panCardPhoto || !formData.submissionPhoto) {
      setSubmitError('Please upload both required photos.');
      setIsLoading(false);
      return;
    }
    try {
      const submitData = new FormData();
      submitData.append('aadharNumber', formData.aadharNumber);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('panNumber', formData.panNumber);
      submitData.append('panCardPhoto', formData.panCardPhoto);
      submitData.append('submissionPhoto', formData.submissionPhoto);
      await kycService.submitKYC(submitData);
      await fetchKYCStatus();
      setFormData({ aadharNumber: '', phoneNumber: '', panNumber: '', panCardPhoto: null, submissionPhoto: null });
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Error submitting KYC');
    } finally {
      setIsLoading(false);
    }
  };

  const overview = portfolioData?.overview || {};
  const holdings = portfolioData?.holdings || [];
  const isPositiveReturn = (overview.totalReturns || 0) >= 0;

  const StatCard = ({ title, value, icon: Icon, iconColor, sub, subColor, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="ui-card p-6 dark:bg-slate-900/50"
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor} shadow-sm`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1.5">{value}</p>
      {sub && <p className={`text-[11px] font-bold uppercase tracking-tight ${subColor}`}>{sub}</p>}
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Portfolio Value" value={`₹${(overview.currentValue || 0).toLocaleString('en-IN')}`} icon={Wallet} iconColor="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" sub="Market Value" subColor="text-slate-400 dark:text-slate-500" delay={0.1} />
        <StatCard title="Total Invested" value={`₹${(overview.totalInvested || 0).toLocaleString('en-IN')}`} icon={PieChart} iconColor="bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" sub="Principal Amount" subColor="text-slate-400 dark:text-slate-500" delay={0.2} />
        <StatCard title="Total Returns" value={`${isPositiveReturn ? '+' : '-'}₹${Math.abs(overview.totalReturns || 0).toLocaleString('en-IN')}`} icon={isPositiveReturn ? TrendingUp : TrendingDown} iconColor={isPositiveReturn ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'} sub={`${isPositiveReturn ? '+' : ''}${(overview.totalReturnsPercent || 0).toFixed(2)}% net`} subColor={isPositiveReturn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'} delay={0.3} />
        <StatCard title="Fund Assets" value={holdings.length} icon={BarChart3} iconColor="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" sub="Active Holdings" subColor="text-slate-400 dark:text-slate-500" delay={0.4} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="ui-card p-6 sm:p-8 dark:bg-slate-900/40"
      >
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
           <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">View History</button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
           <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Clock size={24} className="text-slate-300 dark:text-slate-600" />
           </div>
           <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No transactions yet</p>
           <p className="text-xs text-slate-400 max-w-[240px]">Start investing in mutual funds to see your activity logs here.</p>
        </div>
      </motion.div>
    </div>
  );

  const renderKYC = () => {
    if (kycStatus === 'Approved') return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ui-card p-12 text-center max-w-xl mx-auto dark:bg-slate-900/50"
      >
        <div className="w-20 h-20 rounded-[32px] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="text-emerald-500" size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">Verification Complete</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Your KYC status is <b>Approved</b>. Your account is fully unlocked for all investment products.
        </p>
      </motion.div>
    );

    if (kycStatus === 'Pending') return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ui-card p-12 text-center max-w-xl mx-auto dark:bg-slate-900/50"
      >
        <div className="w-20 h-20 rounded-[32px] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Clock className="text-amber-500" size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">Review in Progress</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Our team is currently verifying your documents. This usually takes 24–48 hours.
        </p>
      </motion.div>
    );

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card p-6 sm:p-10 max-w-3xl mx-auto dark:bg-slate-900/50"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Submit KYC Documents</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">SEBI compliance requires identity verification.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
             <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
             <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Safe & Secure</span>
          </div>
        </div>

        {kycStatus === 'Rejected' && (
          <div className="mb-8 flex items-start gap-4 p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
            <XCircle className="text-rose-500 shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">Submission Rejected</p>
              <p className="text-xs text-rose-600 dark:text-rose-500 font-medium mt-1">Please ensure all photos are clear and details match your identity cards.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitKYC} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'aadharNumber', label: 'Aadhar Number', placeholder: '1234 5678 9012' },
              { name: 'panNumber', label: 'PAN Number', placeholder: 'ABCDE1234F' },
              { name: 'phoneNumber', label: 'Phone Number', placeholder: '+91 98765 43210' },
            ].map(f => (
              <div key={f.name} className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{f.label}</label>
                <input 
                  type="text" 
                  name={f.name} 
                  required 
                  value={formData[f.name]} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3.5 px-4 outline-none transition-all font-bold text-sm" 
                  placeholder={f.placeholder} 
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Required Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'panCardPhoto', label: 'PAN Card Scan' },
                { name: 'submissionPhoto', label: 'Verification Selfie' },
              ].map(f => (
                <div key={f.name} className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-8 text-center transition-all cursor-pointer bg-slate-50/30 dark:bg-slate-900/20">
                  <Upload className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4 group-hover:scale-110 group-hover:text-indigo-500 transition-all" />
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">{f.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">MAX 5MB · JPG/PNG</p>
                  <label className="mt-6 cursor-pointer inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    Upload
                    <input type="file" name={f.name} onChange={handleFileChange} className="hidden" accept="image/jpeg, image/png" />
                  </label>
                  {formData[f.name] && <p className="mt-4 text-[10px] text-emerald-600 font-black truncate px-4">{formData[f.name].name}</p>}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm rounded-[24px] shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-60 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : 'Complete Verification'}
          </button>
        </form>
      </motion.div>
    );
  };

  return (
    <div className="w-full">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Your account pulse and critical tasks.</p>
        </div>
        {kycStatus !== 'Approved' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-5 py-3 rounded-2xl"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-black uppercase tracking-tight">KYC Verification Required</p>
          </motion.div>
        )}
      </header>

      {/* Modern Tabs */}
      <div className="mb-10 flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[22px] w-fit">
        {[
          { id: 'overview', label: 'Pulse Overview' },
          { id: 'kyc', label: 'Security & KYC' },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-[18px] transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' ? renderOverview() : renderKYC()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InvestorDashboard;
