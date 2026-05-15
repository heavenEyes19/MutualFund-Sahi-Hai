import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, ShieldCheck, Clock, XCircle, AlertCircle,
  ChevronRight, FileCheck, Loader2
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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  const kycStatus = user?.kycStatus ?? KYC_STATUS.NOT_SUBMITTED;
  const rejectionReason = user?.kycRejectionReason;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Account information and KYC status</p>
        </div>

        {/* ── User Info Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827] border border-slate-700/60 rounded-2xl p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg">
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-0.5">
              <Mail size={13} /> {user?.email}
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-800 px-2 py-1 rounded">
                {user?.role ?? "investor"}
              </span>
            </div>
          </div>
          <KycStatusBadge status={kycStatus} />
        </motion.div>

        {/* ── KYC Status Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {kycStatus === KYC_STATUS.VERIFIED && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-300">KYC Verified</h3>
                  <p className="text-emerald-400/60 text-xs mt-0.5">Full investment access unlocked</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/dashboard-area/mutual-funds")}
                className="w-full mt-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Browse & Invest <ChevronRight size={15} />
              </button>
            </div>
          )}

          {kycStatus === KYC_STATUS.PENDING_VERIFICATION && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={22} className="text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-300">Verification in Progress</h3>
                </div>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Your documents are under review. You can browse mutual funds in the meantime, but investment features are locked until approval.
              </p>
            </div>
          )}

          {kycStatus === KYC_STATUS.REJECTED && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle size={22} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-300">KYC Rejected</h3>
                  <p className="text-red-400/60 text-xs mt-0.5">Action required — resubmit your documents</p>
                </div>
              </div>
              {rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <AlertCircle size={10} /> Rejection Reason
                  </p>
                  <p className="text-slate-300 text-sm">{rejectionReason}</p>
                </div>
              )}
              <button
                onClick={() => navigate("/dashboard-area/kyc")}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <FileCheck size={15} /> Resubmit KYC
              </button>
            </div>
          )}

          {kycStatus === KYC_STATUS.NOT_SUBMITTED && (
            <div className="bg-[#111827] border border-slate-700/60 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileCheck size={22} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">KYC Not Submitted</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Complete your KYC to unlock all investment features</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: "🪪", title: "PAN Details", desc: "Enter your PAN number" },
                  { icon: "📋", title: "Aadhaar", desc: "12-digit Aadhaar" },
                  { icon: "📸", title: "Documents", desc: "Upload photos" },
                ].map((item) => (
                  <div key={item.title} className="bg-[#0B1120] border border-slate-800 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <p className="text-white text-xs font-bold">{item.title}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/dashboard-area/kyc")}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <FileCheck size={16} /> Complete KYC Now <ChevronRight size={15} />
              </button>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

/* ── KYC Status Badge ── */
function KycStatusBadge({ status }) {
  const config = {
    [KYC_STATUS.VERIFIED]: {
      icon: <ShieldCheck size={12} />,
      label: "Verified",
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    [KYC_STATUS.PENDING_VERIFICATION]: {
      icon: <Clock size={12} />,
      label: "Pending",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    [KYC_STATUS.REJECTED]: {
      icon: <XCircle size={12} />,
      label: "Rejected",
      cls: "bg-red-500/10 text-red-400 border-red-500/30",
    },
    [KYC_STATUS.NOT_SUBMITTED]: {
      icon: <AlertCircle size={12} />,
      label: "KYC Pending",
      cls: "bg-slate-700/60 text-slate-400 border-slate-600/40",
    },
  };
  const { icon, label, cls } = config[status] ?? config[KYC_STATUS.NOT_SUBMITTED];
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${cls}`}>
      {icon} {label}
    </span>
  );
}