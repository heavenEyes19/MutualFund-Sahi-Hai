import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, ShieldCheck, Clock, XCircle, AlertCircle,
  ChevronRight, FileCheck, Loader2, User, Settings, LogOut, 
  ShieldAlert, Phone, Key, Building2, UserPlus, Save, Plus, Trash2
} from "lucide-react";
import API from "../services/api";
import { KYC_STATUS } from "../hooks/useKycStatus";
import { toast } from "react-hot-toast";

const TABS = {
  OVERVIEW: "overview",
  PERSONAL: "personal",
  KYC: "kyc",
  SECURITY: "security",
  BANKING: "banking"
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [personalForm, setPersonalForm] = useState({ name: "", phoneNumber: "" });
  const [mpinForm, setMpinForm] = useState({ oldMpin: "", newMpin: "", confirmMpin: "" });
  const [bankForm, setBankForm] = useState({ accountNumber: "", ifsc: "", bankName: "", accountHolderName: "" });
  const [nomineeForm, setNomineeForm] = useState({ name: "", relationship: "", allocation: 100 });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/profile");
      setUser(res.data);
      setPersonalForm({ name: res.data.name, phoneNumber: res.data.phoneNumber || "" });
    } catch (err) {
      console.error("Failed to load profile", err);
      toast.error("Failed to sync profile data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await API.post("/users/update-profile", personalForm);
      toast.success("Profile updated successfully");
      fetchProfile();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const [mpinStep, setMpinStep] = useState('idle'); // idle | request-otp | enter-otp | set-mpin
  const [mpinOtp, setMpinOtp] = useState('');
  const [mpinNew, setMpinNew] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');

  const handleRequestMpinOtp = async () => {
    setIsSaving(true);
    try {
      await API.post('/users/request-mpin-otp');
      toast.success('OTP sent to your registered email!');
      setMpinStep('enter-otp');
      setMpinOtp(''); setMpinNew(''); setMpinConfirm('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyOtpStep = async () => {
    if (mpinOtp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setIsSaving(true);
    try {
      await API.post('/users/verify-mpin-otp', { otp: mpinOtp });
      toast.success('OTP verified!');
      setMpinStep('set-mpin');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Incorrect OTP');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetMpinViaOtp = async (e) => {
    e.preventDefault();
    if (mpinNew.length < 4) { toast.error('MPIN must be at least 4 digits'); return; }
    if (mpinNew !== mpinConfirm) { toast.error('MPINs do not match'); return; }
    setIsSaving(true);
    try {
      await API.post('/users/set-mpin-via-otp', { otp: mpinOtp, newMpin: mpinNew, confirmMpin: mpinConfirm });
      toast.success('MPIN set successfully!');
      setMpinStep('idle');
      setMpinOtp(''); setMpinNew(''); setMpinConfirm('');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to set MPIN');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await API.post("/users/bank-accounts", bankForm);
      toast.success("Bank account added");
      setBankForm({ accountNumber: "", ifsc: "", bankName: "", accountHolderName: "" });
      fetchProfile();
    } catch (err) {
      toast.error("Failed to add bank account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNominee = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await API.post("/users/nominees", nomineeForm);
      toast.success("Nominee added");
      setNomineeForm({ name: "", relationship: "", allocation: 100 });
      fetchProfile();
    } catch (err) {
      toast.error("Failed to add nominee");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Profile Data</p>
      </div>
    );
  }

  const kycStatus = user?.kycStatus ?? KYC_STATUS.NOT_SUBMITTED;

  return (
    <div className="w-full transition-colors duration-300 font-inter max-w-5xl mx-auto py-4">
      {/* Header */}
      <header className="mb-8 px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Account Intelligence</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Identity Terminal</h1>
      </header>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-4 mb-8 px-4 no-scrollbar gap-2">
        {Object.entries(TABS).map(([key, value]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border ${
              activeTab === value
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {activeTab === TABS.OVERVIEW && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="ui-card p-8 flex flex-col sm:flex-row items-center gap-8 dark:bg-slate-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full" />
                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-black text-4xl shrink-0 shadow-2xl shadow-indigo-500/20">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate mb-2">{user?.name}</h2>
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[13px] font-bold">
                      <Mail size={16} className="text-indigo-500" /> {user?.email}
                    </div>
                    {user?.phoneNumber && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[13px] font-bold">
                        <Phone size={16} className="text-indigo-500" /> {user.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Protocol</p>
                   <KycStatusBadge status={kycStatus} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="ui-card p-6 dark:bg-slate-900/40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Wallet Power</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{user?.walletBalance?.toLocaleString() ?? 0}</p>
                 </div>
                 <div className="ui-card p-6 dark:bg-slate-900/40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Linked Banks</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{user?.bankAccounts?.length ?? 0} Accounts</p>
                 </div>
                 <div className="ui-card p-6 dark:bg-slate-900/40 cursor-pointer hover:border-indigo-500/30 transition-all" onClick={() => { setActiveTab(TABS.SECURITY); setMpinStep('idle'); }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Security Level</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={20} className={user?.isMpinSet ? "text-emerald-500" : "text-amber-500"} />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{user?.isMpinSet ? "MPIN Active" : "MPIN Not Set"}</p>
                    </div>
                    {!user?.isMpinSet && <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest">Tap to set MPIN →</p>}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === TABS.PERSONAL && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="ui-card p-8 dark:bg-slate-900/40 max-w-2xl mx-auto"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
                <User size={20} className="text-indigo-500" /> Bio Metadata
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Legal Name</label>
                  <input
                    type="text"
                    value={personalForm.name}
                    onChange={(e) => setPersonalForm({...personalForm, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Primary Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="tel"
                      value={personalForm.phoneNumber}
                      onChange={(e) => setPersonalForm({...personalForm, phoneNumber: e.target.value})}
                      placeholder="Enter 10 digit number"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Anchor (Read-only)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700" size={16} />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Synchronize Data
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === TABS.SECURITY && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="ui-card p-8 dark:bg-slate-900/40 max-w-2xl mx-auto"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-2">
                <Key size={20} className="text-indigo-500" /> Security Protocol
              </h3>
              <p className="text-xs font-medium text-slate-500 mb-8">Your 4-digit MPIN secures all wallet transactions. Changing it always requires email OTP verification.</p>

              {/* Status card */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border mb-8 ${user.isMpinSet ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'}`}>
                <ShieldCheck size={24} className={user.isMpinSet ? 'text-emerald-500' : 'text-amber-500'} />
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{user.isMpinSet ? 'MPIN Active' : 'MPIN Not Set'}</p>
                  <p className="text-[10px] text-slate-500">{user.isMpinSet ? 'Your transactions are protected by MPIN.' : 'Set an MPIN to enable quick transaction confirmation.'}</p>
                </div>
              </div>

              {/* Step: idle */}
              {mpinStep === 'idle' && (
                <div className="space-y-4">
                  <button
                    onClick={handleRequestMpinOtp}
                    disabled={isSaving}
                    className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                    {user.isMpinSet ? 'Reset / Change MPIN' : 'Set MPIN via Email OTP'}
                  </button>
                </div>
              )}

              {/* Step: enter-otp */}
              {mpinStep === 'enter-otp' && (
                <div className="space-y-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Check your email inbox for the 6-digit OTP we sent you.</p>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={mpinOtp}
                      onChange={(e) => setMpinOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setMpinStep('idle')} className="flex-1 py-3 text-slate-500 text-sm font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                    <button
                      onClick={handleVerifyOtpStep}
                      disabled={mpinOtp.length < 6}
                      className="flex-1 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Verify OTP
                    </button>
                  </div>
                  <button onClick={handleRequestMpinOtp} disabled={isSaving} className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Resend OTP
                  </button>
                </div>
              )}

              {/* Step: set-mpin */}
              {mpinStep === 'set-mpin' && (
                <form onSubmit={handleSetMpinViaOtp} className="space-y-6">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">✓ OTP verified! Now create your new 4-digit MPIN.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">New MPIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={mpinNew}
                        onChange={(e) => setMpinNew(e.target.value.replace(/\D/g, ''))}
                        placeholder="4 digits"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Confirm MPIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={mpinConfirm}
                        onChange={(e) => setMpinConfirm(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving || mpinNew.length < 4 || mpinConfirm.length < 4}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Set MPIN &amp; Save
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === TABS.BANKING && (
            <motion.div
              key="banking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Linked Bank Accounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Building2 size={20} className="text-indigo-500" /> Linked Banks
                  </h3>
                  <div className="space-y-4">
                    {user.bankAccounts?.length > 0 ? (
                      user.bankAccounts.map((bank, i) => (
                        <div key={i} className="ui-card p-5 dark:bg-slate-900/40 border-l-4 border-indigo-500 group relative">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{bank.bankName}</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white mb-1">{bank.accountNumber}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IFSC: {bank.ifsc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No banks linked yet</p>
                      </div>
                    )}
                    
                    <div className="ui-card p-6 dark:bg-slate-900/40 border-dashed border-2">
                       <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Add New Node</p>
                       <form onSubmit={handleAddBank} className="space-y-4">
                          <input
                            type="text"
                            placeholder="Bank Name"
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="A/C Number"
                              value={bankForm.accountNumber}
                              onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                              required
                            />
                            <input
                              type="text"
                              placeholder="IFSC Code"
                              value={bankForm.ifsc}
                              onChange={(e) => setBankForm({...bankForm, ifsc: e.target.value.toUpperCase()})}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                          >
                            Add Bank Account
                          </button>
                       </form>
                    </div>
                  </div>
                </div>

                {/* Nominees */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <UserPlus size={20} className="text-indigo-500" /> Beneficiaries
                  </h3>
                  <div className="space-y-4">
                    {user.nominees?.length > 0 ? (
                      user.nominees.map((nom, i) => (
                        <div key={i} className="ui-card p-5 dark:bg-slate-900/40 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{nom.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{nom.relationship}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{nom.allocation}%</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No nominees assigned</p>
                      </div>
                    )}

                    <div className="ui-card p-6 dark:bg-slate-900/40 border-dashed border-2">
                       <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Register Nominee</p>
                       <form onSubmit={handleAddNominee} className="space-y-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={nomineeForm.name}
                            onChange={(e) => setNomineeForm({...nomineeForm, name: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Relationship"
                              value={nomineeForm.relationship}
                              onChange={(e) => setNomineeForm({...nomineeForm, relationship: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Allocation %"
                              value={nomineeForm.allocation}
                              onChange={(e) => setNomineeForm({...nomineeForm, allocation: parseInt(e.target.value)})}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl"
                          >
                            Assign Beneficiary
                          </button>
                       </form>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === TABS.KYC && (
            <motion.div
              key="kyc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {kycStatus === KYC_STATUS.VERIFIED && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[32px] p-8 sm:p-10 max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck size={32} className="text-emerald-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Identity Secured</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Full regulatory clearance achieved. All features unlocked.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-emerald-100/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN Verified</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Active Node</p>
                     </div>
                     <div className="bg-white/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-emerald-100/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Biometrics</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Live Sync</p>
                     </div>
                  </div>
                </div>
              )}

              {kycStatus === KYC_STATUS.PENDING_VERIFICATION && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[32px] p-8 sm:p-10 max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <Clock size={32} className="text-amber-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Verification in Progress</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Our compliance nodes are verifying your identity tokens.</p>
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/30 p-5 rounded-2xl border border-amber-100/50 dark:border-amber-500/10">
                     <p className="text-xs font-bold text-amber-700 dark:text-amber-500 leading-relaxed text-center">
                       Expected resolution in 24-48 business hours.
                     </p>
                  </div>
                </div>
              )}

              {kycStatus === KYC_STATUS.REJECTED && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[32px] p-8 sm:p-10 space-y-8 max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldAlert size={32} className="text-rose-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Suspended</h3>
                      <p className="text-rose-600 dark:text-rose-400 font-bold text-[11px] uppercase tracking-widest mt-1">KYC Resubmission Required</p>
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-950/30 border border-rose-100/50 dark:border-rose-500/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Compliance Notes</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-bold leading-relaxed">{user.kycRejectionReason}</p>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard-area/kyc")}
                    className="w-full py-5 bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                  >
                    <FileCheck size={18} /> Resubmit Application
                  </button>
                </div>
              )}

              {kycStatus === KYC_STATUS.NOT_SUBMITTED && (
                <div className="ui-card p-8 sm:p-12 dark:bg-slate-900/40 border-indigo-500/20 max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner">
                      <FileCheck size={36} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Unlock Capital Deployment</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Complete your identity verification to start your investment journey.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard-area/kyc")}
                    className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[22px] shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                  >
                    Initialize Verification <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] mt-16 mb-8">
        Encrypted Data Protocol · v2.4.2
      </p>
    </div>
  );
}

function KycStatusBadge({ status }) {
  const config = {
    [KYC_STATUS.VERIFIED]: {
      icon: <ShieldCheck size={12} />,
      label: "Identity Verified",
      cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    },
    [KYC_STATUS.PENDING_VERIFICATION]: {
      icon: <Clock size={12} />,
      label: "Review Pending",
      cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    },
    [KYC_STATUS.REJECTED]: {
      icon: <XCircle size={12} />,
      label: "Access Blocked",
      cls: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    },
    [KYC_STATUS.NOT_SUBMITTED]: {
      icon: <AlertCircle size={12} />,
      label: "KYC Required",
      cls: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700",
    },
  };
  const { icon, label, cls } = config[status] ?? config[KYC_STATUS.NOT_SUBMITTED];
  return (
    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0 ${cls}`}>
      {icon} {label}
    </span>
  );
}