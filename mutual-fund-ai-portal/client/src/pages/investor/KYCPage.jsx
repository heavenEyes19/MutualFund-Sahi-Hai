import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, Upload, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, ArrowLeft, ShieldCheck, Clock, XCircle, Shield
} from "lucide-react";
import API from "../../services/api";
import { useKycStatus } from "../../hooks/useKycStatus";
import { KYC_STATUS } from "../../hooks/useKycStatus";

export default function KYCPage() {
  const navigate = useNavigate();
  const { kycStatus, kycRejectionReason, loading: kycLoading, refetch } = useKycStatus();

  // Form state
  const [aadharNumber, setAadharNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [panCardPhoto, setPanCardPhoto] = useState(null);
  const [submissionPhoto, setSubmissionPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const handleKYCSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage(null);

    try {
      const formData = new FormData();
      formData.append("aadharNumber", aadharNumber);
      formData.append("phoneNumber", phoneNumber);
      formData.append("panNumber", panNumber);
      if (panCardPhoto) formData.append("panCardPhoto", panCardPhoto);
      if (submissionPhoto) formData.append("submissionPhoto", submissionPhoto);

      await API.post("/kyc/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormMessage({
        type: "success",
        text: "KYC submitted successfully! Your documents are now under review.",
      });
      await refetch();
    } catch (err) {
      setFormMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to submit KYC. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (kycLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Fetching Identity Status…</p>
        </div>
      </div>
    );
  }

  if (kycStatus === KYC_STATUS.VERIFIED) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md ui-card p-10 sm:p-12 text-center dark:bg-slate-900/50"
        >
          <div className="w-24 h-24 rounded-[32px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/10">
            <ShieldCheck size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Identity Secured</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
            Your KYC has been approved. You now have unrestricted access to all investment products.
          </p>
          <button
            onClick={() => navigate("/dashboard-area/explore")}
            className="w-full py-4 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:-translate-y-1 active:translate-y-0 transition-all"
          >
            Enter Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (kycStatus === KYC_STATUS.PENDING_VERIFICATION) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md ui-card p-10 sm:p-12 text-center dark:bg-slate-900/50"
        >
          <div className="w-24 h-24 rounded-[32px] bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center mx-auto mb-8 animate-pulse shadow-2xl shadow-amber-500/10">
            <Clock size={48} className="text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Under Review</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
            Our compliance team is currently reviewing your documents. We'll notify you as soon as it's completed.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-left mb-10">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estimated Time</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">24 — 48 Business Hours</p>
          </div>
          <button
            onClick={() => navigate("/dashboard-area/explore")}
            className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
          >
            Explore Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const isRejected = kycStatus === KYC_STATUS.REJECTED;

  return (
    <div className="w-full transition-colors duration-300 font-inter">
      <div className="max-w-3xl mx-auto py-4">

        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest mb-8"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-[22px] flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
              <FileCheck size={32} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {isRejected ? "Resubmit KYC" : "Identity Verification"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                {isRejected ? "Correct the issues identified and resubmit." : "SEBI regulated process to secure your account."}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection banner */}
        {isRejected && kycRejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[28px] p-6 flex items-start gap-4"
          >
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <XCircle size={22} className="text-rose-500" />
            </div>
            <div>
              <p className="text-rose-700 dark:text-rose-400 text-sm font-black uppercase tracking-tight mb-1">Submission Rejected</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{kycRejectionReason}</p>
            </div>
          </motion.div>
        )}

        {/* Steps indicator */}
        <div className="mb-12 flex items-center gap-4">
          {["Identity", "Documents", "Review"].map((step, i) => (
            <div key={step} className="flex items-center gap-4 flex-1">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-all ${i === 0 ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/25" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                {i + 1}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block ${i === 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>{step}</span>
              {i < 2 && <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${i === 0 ? 'w-1/2 bg-indigo-500' : 'w-0'}`} />
              </div>}
            </div>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ui-card p-8 sm:p-12 dark:bg-slate-900/40"
        >
          <AnimatePresence>
            {formMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-8 p-5 rounded-2xl flex items-start gap-4 text-sm border ${
                  formMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
                }`}
              >
                {formMessage.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <span className="font-bold">{formMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleKYCSubmit} className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6">Step 01: Identification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField label="PAN Number" placeholder="ABCDE1234F" value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())} maxLength={10} required hint="Income Tax ID" />
                <FormField label="Aadhaar Number" placeholder="0000 0000 0000" value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, "").slice(0, 12))} maxLength={12} required hint="12-digit UIDAI" />
              </div>
              <div>
                <FormField label="Mobile Number" placeholder="+91 00000 00000" value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)} required hint="Linked to bank account" />
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Step 02: Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileField label="PAN Card Photo" sublabel="Clear scan of original card"
                  accept="image/jpeg,image/jpg,image/png" file={panCardPhoto}
                  onChange={(e) => setPanCardPhoto(e.target.files[0])} required />
                <FileField label="Live Selfie" sublabel="Hold PAN card near face"
                  accept="image/jpeg,image/jpg,image/png" file={submissionPhoto}
                  onChange={(e) => setSubmissionPhoto(e.target.files[0])} required />
              </div>
            </div>

            {/* Privacy Shield */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Shield size={24} className="text-emerald-500" />
               </div>
               <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">AES-256 Vault Encryption</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Your documents are encrypted and shared only with SEBI authorized KRAs.</p>
               </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-indigo-600 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : isRejected ? (
                <><RefreshCw size={18} /> Resubmit Application</>
              ) : (
                <><Upload size={18} /> Complete Verification</>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-10">
          MFSH Limited · SEBI RIA · AMFI Registered Distributor
        </p>
      </div>
    </div>
  );
}

function FormField({ label, hint, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <input
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 px-5 outline-none transition-all font-bold text-sm"
        {...props}
      />
      {hint && <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter pl-1">{hint}</p>}
    </div>
  );
}

function FileField({ label, sublabel, file, onChange, accept, required }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <label className="flex flex-col items-center justify-center w-full h-44 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-[28px] cursor-pointer transition-all group overflow-hidden relative">
        <input type="file" className="hidden" accept={accept} onChange={onChange} required={required} />
        {file ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center p-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
               <CheckCircle2 size={24} />
            </div>
            <span className="text-[11px] text-slate-900 dark:text-white font-black truncate max-w-[180px] text-center mb-1">{file.name}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Click to Replace</span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-indigo-500 transition-all">
               <Upload size={24} />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">Upload Document</span>
            {sublabel && <span className="text-[9px] font-bold text-slate-400 mt-2 px-6 text-center leading-relaxed uppercase tracking-tighter">{sublabel}</span>}
          </div>
        )}
      </label>
    </div>
  );
}
