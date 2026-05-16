import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, ShieldCheck, Clock, XCircle, AlertCircle,
  ChevronRight, FileCheck, Loader2, User, Settings, LogOut, ShieldAlert
} from "lucide-react";
import API from "../services/api";
import { KYC_STATUS } from "../hooks/useKycStatus";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Profile Data</p>
      </div>
    );
  }

  const kycStatus = user?.kycStatus ?? KYC_STATUS.NOT_SUBMITTED;
  const rejectionReason = user?.kycRejectionReason;

  return (
    <div className="w-full transition-colors duration-300 font-inter">
      <div className="max-w-3xl mx-auto py-4">

        {/* Header */}
        <header className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Account Intelligence</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Personal Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your identity and security protocols.</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          
          {/* ── User Meta Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ui-card p-8 flex flex-col sm:flex-row items-center gap-8 dark:bg-slate-900/40 relative overflow-hidden"
          >
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
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.role ?? "Investor"}</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Protocol</p>
               <KycStatusBadge status={kycStatus} />
            </div>
          </motion.div>

          {/* ── KYC Critical Path ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {kycStatus === KYC_STATUS.VERIFIED && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[32px] p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck size={32} className="text-emerald-500" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Identity Secured</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Full regulatory clearance achieved. All features unlocked.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/dashboard-area/explore")}
                  className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  Enter Market Terminal <ChevronRight size={18} />
                </button>
              </div>
            )}

            {kycStatus === KYC_STATUS.PENDING_VERIFICATION && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[32px] p-8 sm:p-10">
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
                   <p className="text-xs font-bold text-amber-700 dark:text-amber-500 leading-relaxed">
                     You can continue to browse the fund universe, but trade execution will be enabled only after verification completes.
                   </p>
                </div>
              </div>
            )}

            {kycStatus === KYC_STATUS.REJECTED && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[32px] p-8 sm:p-10 space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldAlert size={32} className="text-rose-500" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Suspended</h3>
                    <p className="text-rose-600 dark:text-rose-400 font-bold text-[11px] uppercase tracking-widest mt-1">KYC Resubmission Required</p>
                  </div>
                </div>
                {rejectionReason && (
                  <div className="bg-white/50 dark:bg-slate-950/30 border border-rose-100/50 dark:border-rose-500/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Compliance Notes</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-bold leading-relaxed">{rejectionReason}</p>
                  </div>
                )}
                <button
                  onClick={() => navigate("/dashboard-area/kyc")}
                  className="w-full py-5 bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <FileCheck size={18} /> Resubmit Application
                </button>
              </div>
            )}

            {kycStatus === KYC_STATUS.NOT_SUBMITTED && (
              <div className="ui-card p-8 sm:p-12 dark:bg-slate-900/40 border-indigo-500/20">
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner">
                    <FileCheck size={36} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Unlock Capital Deployment</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Complete your identity verification to start your investment journey.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  {[
                    { title: "ID Token", desc: "PAN Identity", icon: <User size={18} /> },
                    { title: "Biometric", desc: "Selfie Verify", icon: <Settings size={18} /> },
                    { title: "Address", desc: "Aadhaar UID", icon: <ShieldCheck size={18} /> },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-center group hover:border-indigo-500/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">
                        {item.icon}
                      </div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{item.desc}</p>
                    </div>
                  ))}
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

          {/* ── Security Settings ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <button className="ui-card p-6 flex items-center justify-between group hover:border-indigo-500/50 transition-all dark:bg-slate-900/40">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Settings size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Security Vault</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Change Password & 2FA</p>
                   </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
             </button>
             <button className="ui-card p-6 flex items-center justify-between group hover:border-rose-500/50 transition-all dark:bg-slate-900/40">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                      <LogOut size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Terminate Session</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Secure Logout</p>
                   </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
             </button>
          </div>

        </div>

        <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] mt-16">
          Encrypted Data Protocol · v2.4.1
        </p>
      </div>
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