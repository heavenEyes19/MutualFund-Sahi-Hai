import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, Upload, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, ArrowLeft, ShieldCheck, Clock, XCircle
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
  const [formMessage, setFormMessage] = useState(null); // { type: 'success'|'error', text }

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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  // If already verified, show success state
  if (kycStatus === KYC_STATUS.VERIFIED) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#111827] border border-emerald-500/30 rounded-3xl p-8 text-center"
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500 -mt-8 mb-8 -mx-8 w-[calc(100%+4rem)]" />
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <ShieldCheck size={38} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">KYC Verified!</h2>
          <p className="text-slate-400 text-sm mb-8">
            You have full access to invest, create SIPs, and manage your portfolio.
          </p>
          <button
            onClick={() => navigate("/dashboard-area/mutual-funds")}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            Start Investing →
          </button>
        </motion.div>
      </div>
    );
  }

  // If pending, show waiting state — no form
  if (kycStatus === KYC_STATUS.PENDING_VERIFICATION) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#111827] border border-amber-500/30 rounded-3xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <Clock size={38} className="text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Under Verification</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Your KYC documents have been submitted and are being reviewed by our team.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left mb-8">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">What happens next?</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              You'll be notified once your KYC is approved. In the meantime, you can browse mutual funds freely.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard-area/mutual-funds")}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all text-sm"
          >
            Browse Funds
          </button>
        </motion.div>
      </div>
    );
  }

  // NOT_SUBMITTED or REJECTED — show the form
  const isRejected = kycStatus === KYC_STATUS.REJECTED;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-medium mb-5 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center ring-1 ring-blue-500/20">
              <FileCheck size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isRejected ? "Resubmit KYC" : "Complete Your KYC"}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {isRejected
                  ? "Correct the issue and resubmit your documents"
                  : "Verify your identity to unlock investment features"}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection reason banner */}
        {isRejected && kycRejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-red-300 text-sm font-bold mb-1">Your previous submission was rejected</p>
              <p className="text-slate-400 text-sm">{kycRejectionReason}</p>
            </div>
          </motion.div>
        )}

        {/* Steps indicator */}
        <div className="mb-8 flex items-center gap-3">
          {["Personal Details", "Documents", "Submit"].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                }`}>
                {i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${i === 0 ? "text-blue-400" : "text-slate-600"}`}>
                {step}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-slate-800" />}
            </div>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827] border border-slate-700/60 rounded-2xl p-6 lg:p-8"
        >

          {/* Form message */}
          <AnimatePresence>
            {formMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm border ${formMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
              >
                {formMessage.type === "success"
                  ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                <span>{formMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleKYCSubmit} className="space-y-6">

            {/* Section: Personal Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 pb-2 border-b border-slate-800">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="PAN Number"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                  hint="10-character alphanumeric"
                />
                <FormField
                  label="Aadhaar Number"
                  placeholder="1234 5678 9012"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  maxLength={12}
                  required
                  hint="12-digit Aadhaar number"
                />
              </div>
              <div className="mt-4">
                <FormField
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  hint="Registered mobile number"
                />
              </div>
            </div>

            {/* Section: Document Upload */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 pb-2 border-b border-slate-800">
                Document Upload
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileField
                  label="PAN Card Photo"
                  sublabel="Upload a clear photo of your PAN card"
                  accept="image/jpeg,image/jpg,image/png"
                  file={panCardPhoto}
                  onChange={(e) => setPanCardPhoto(e.target.files[0])}
                  required
                />
                <FileField
                  label="Selfie / Verification Photo"
                  sublabel="Hold your PAN card and take a selfie"
                  accept="image/jpeg,image/jpg,image/png"
                  file={submissionPhoto}
                  onChange={(e) => setSubmissionPhoto(e.target.files[0])}
                  required
                />
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-bold text-slate-400 mb-2">📋 Document Guidelines</p>
              <p>• PAN card photo should be clearly visible with all 4 corners in frame</p>
              <p>• Selfie must show you holding your PAN card next to your face</p>
              <p>• Accepted formats: JPG, PNG — max 5MB per file</p>
              <p>• Ensure good lighting and no blurriness</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Submitting...</>
              ) : isRejected ? (
                <><RefreshCw size={16} /> Resubmit KYC</>
              ) : (
                <><Upload size={16} /> Submit KYC for Verification</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Your data is encrypted and used only for regulatory compliance. We never share it with third parties.
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function FormField({ label, hint, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      <input
        className="w-full px-4 py-3 bg-[#0B1120] border border-slate-700/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white text-sm placeholder:text-slate-600 transition-all"
        {...props}
      />
      {hint && <p className="text-[10px] text-slate-600 mt-1 pl-1">{hint}</p>}
    </div>
  );
}

function FileField({ label, sublabel, file, onChange, accept, required }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      <label className="flex flex-col items-center justify-center w-full h-36 bg-[#0B1120] border-2 border-dashed border-slate-700/70 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all group">
        <input type="file" className="hidden" accept={accept} onChange={onChange} required={required} />
        {file ? (
          <>
            <CheckCircle2 size={26} className="text-emerald-400 mb-2" />
            <span className="text-xs text-emerald-400 font-semibold truncate max-w-[90%] text-center">{file.name}</span>
            <span className="text-[10px] text-slate-600 mt-1">Click to change</span>
          </>
        ) : (
          <>
            <Upload size={26} className="text-slate-600 group-hover:text-blue-400 mb-2 transition-colors" />
            <span className="text-xs text-slate-500 font-semibold group-hover:text-slate-400 transition-colors">Click to upload</span>
            {sublabel && <span className="text-[10px] text-slate-600 mt-1 px-3 text-center leading-relaxed">{sublabel}</span>}
          </>
        )}
      </label>
    </div>
  );
}
