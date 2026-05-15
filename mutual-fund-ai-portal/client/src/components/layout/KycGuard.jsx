import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Clock, XCircle, FileCheck, ArrowRight, RefreshCw } from "lucide-react";
import { KYC_STATUS } from "../../hooks/useKycStatus";

/**
 * KycGuard — Renders a blocking overlay whenever the user's KYC status
 * is anything other than VERIFIED.
 *
 * Props:
 *  - kycStatus: string (from KYC_STATUS enum)
 *  - kycRejectionReason: string | null
 *  - loading: boolean
 *  - children: ReactNode (shown only when VERIFIED)
 */
export default function KycGuard({ kycStatus, kycRejectionReason, loading, children }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (kycStatus === KYC_STATUS.VERIFIED) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-gray-950">
      {/* Blurred background content hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 overflow-hidden">
        {children}
      </div>

      {/* Blocking overlay */}
      <AnimatePresence>
        <motion.div
          key="kyc-guard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-md"
          >
            {kycStatus === KYC_STATUS.NOT_SUBMITTED && (
              <NotSubmittedCard onComplete={() => navigate('/dashboard-area/kyc')} />
            )}
            {kycStatus === KYC_STATUS.PENDING_VERIFICATION && (
              <PendingCard />
            )}
            {kycStatus === KYC_STATUS.REJECTED && (
              <RejectedCard
                reason={kycRejectionReason}
                onResubmit={() => navigate('/dashboard-area/kyc')}
              />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────── Sub-cards ─────────────────────── */

function NotSubmittedCard({ onComplete }) {
  return (
    <div className="bg-[#111827] border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <FileCheck size={36} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">KYC Required</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          You need to complete your KYC (Know Your Customer) verification before you can invest, create SIPs, or access your portfolio.
        </p>
        <button
          onClick={onComplete}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-sm"
        >
          Complete KYC Now <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function PendingCard() {
  return (
    <div className="bg-[#111827] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500" />
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <Clock size={36} className="text-amber-400 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verification in Progress</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Your KYC documents have been submitted and are currently under review.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">What happens next?</p>
          <p className="text-slate-400 text-sm">Our team is reviewing your PAN and Aadhaar documents. You'll get access to invest as soon as your KYC is approved.</p>
        </div>
      </div>
    </div>
  );
}

function RejectedCard({ reason, onResubmit }) {
  return (
    <div className="bg-[#111827] border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <XCircle size={36} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">KYC Rejected</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          Unfortunately, your KYC application was rejected. Please review the reason below and resubmit with the correct documents.
        </p>

        {reason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-left mb-6">
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldAlert size={12} /> Rejection Reason
            </p>
            <p className="text-slate-300 text-sm">{reason}</p>
          </div>
        )}

        <button
          onClick={onResubmit}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-sm"
        >
          <RefreshCw size={16} /> Resubmit KYC
        </button>
      </div>
    </div>
  );
}
