import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldOff, RefreshCw, X, Eye, EyeOff, Mail } from 'lucide-react';
import API from '../../services/api';

/**
 * MpinModal
 *
 * Props:
 *  - isOpen        : bool
 *  - onClose       : fn
 *  - onVerified    : fn(mpin: string)
 *  - title         : string
 *  - description   : string
 *  - isLoading     : bool
 *  - error         : string | null
 *  - isMpinSet     : bool — if false, shows setup prompt instead of MPIN entry
 */
export default function MpinModal({ isOpen, onClose, onVerified, title, description, isLoading, error, isMpinSet = true }) {
  // 'prompt-setup' | 'enter' | 'enter-otp' | 'set-mpin'
  const [step, setStep] = useState(() => isMpinSet ? 'enter' : 'prompt-setup');

  const [mpin, setMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);
  const [otp, setOtp] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  // Sync step with isMpinSet whenever the modal opens or the prop changes
  useEffect(() => {
    if (isOpen) {
      setStep(isMpinSet ? 'enter' : 'prompt-setup');
      setMpin(''); setOtp(''); setNewMpin(''); setConfirmMpin('');
      setLocalError(''); setLocalSuccess('');
    }
  }, [isOpen, isMpinSet]);

  const reset = () => {
    setMpin(''); setOtp(''); setNewMpin(''); setConfirmMpin('');
    setLocalError(''); setLocalSuccess('');
    setStep(isMpinSet ? 'enter' : 'prompt-setup');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleRequestOtp = async () => {
    setLocalError(''); setLocalLoading(true);
    try {
      await API.post('/users/request-mpin-otp');
      setLocalSuccess('OTP sent to your registered email!');
      setStep('enter-otp');
    } catch (err) {
      setLocalError(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) { setLocalError('Enter the 6-digit OTP'); return; }
    setLocalError('');
    setStep('set-mpin');
  };

  const handleSetMpin = async () => {
    setLocalError('');
    if (newMpin.length < 4) { setLocalError('MPIN must be at least 4 digits'); return; }
    if (newMpin !== confirmMpin) { setLocalError('MPINs do not match'); return; }
    setLocalLoading(true);
    try {
      await API.post('/users/set-mpin-via-otp', { otp, newMpin, confirmMpin });
      setLocalSuccess('MPIN set! Confirming transaction…');
      setTimeout(() => { onVerified(newMpin); reset(); }, 800);
    } catch (err) {
      setLocalError(err.response?.data?.msg || 'Failed to set MPIN');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleConfirm = () => {
    if (mpin.length < 4) return;
    onVerified(mpin);
  };

  // Shared input style using the theme system
  const inputCls = "w-full ui-input text-center text-2xl font-mono tracking-[0.5em] !py-3";
  const btnPrimary = "w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-95";
  const btnGhost = "w-full text-center text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center justify-center gap-1 font-semibold py-1";

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div id="mpin-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Card — uses ui-card to inherit light/dark bg automatically */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-sm p-8 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1"
            >
              <X size={18} />
            </button>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                step === 'prompt-setup'
                  ? 'bg-amber-50 dark:bg-amber-500/10'
                  : 'bg-indigo-50 dark:bg-indigo-500/10'
              }`}>
                {step === 'prompt-setup'
                  ? <ShieldOff size={20} className="text-amber-500 dark:text-amber-400" />
                  : <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {step === 'prompt-setup' ? 'MPIN Not Set' : (title || 'Confirm with MPIN')}
                </h3>
                {description && step !== 'prompt-setup' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                )}
              </div>
            </div>

            {/* ── Feedback ── */}
            {(localError || error) && (
              <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl px-3 py-2.5 mb-4">
                {localError || error}
              </div>
            )}
            {localSuccess && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-3 py-2.5 mb-4">
                {localSuccess}
              </div>
            )}

            {/* ── STEP: MPIN not set ── */}
            {step === 'prompt-setup' && (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5 text-center">
                  <ShieldOff size={30} className="text-amber-500 dark:text-amber-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5">No MPIN Configured</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    You need a 4-digit MPIN to confirm transactions. We'll send a verification code to your registered email to set one up now.
                  </p>
                </div>
                <button
                  onClick={handleRequestOtp}
                  disabled={localLoading}
                  className={`${btnPrimary} flex items-center justify-center gap-2`}
                >
                  <Mail size={16} />
                  {localLoading ? 'Sending OTP…' : 'Send OTP to Set MPIN'}
                </button>
                <button onClick={handleClose} className="w-full text-center text-xs text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors py-1">
                  Cancel transaction
                </button>
              </div>
            )}

            {/* ── STEP: Enter existing MPIN ── */}
            {step === 'enter' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Enter 4-digit MPIN</label>
                <div className="relative">
                  <input
                    type={showMpin ? 'text' : 'password'}
                    maxLength={4}
                    value={mpin}
                    onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                    className={inputCls}
                    placeholder="••••"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowMpin(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showMpin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button onClick={handleConfirm} disabled={mpin.length < 4 || isLoading} className={btnPrimary}>
                  {isLoading ? 'Verifying…' : 'Confirm'}
                </button>
                <button onClick={handleRequestOtp} className={btnGhost}>
                  <RefreshCw size={12} /> Forgot MPIN?
                </button>
              </div>
            )}

            {/* ── STEP: Enter OTP ── */}
            {step === 'enter-otp' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Enter the 6-digit OTP sent to your registered email.</p>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">OTP</label>
                <input
                  type="text" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={inputCls} placeholder="••••••" autoFocus
                />
                <button onClick={handleVerifyOtp} disabled={otp.length < 6 || localLoading} className={btnPrimary}>
                  Verify OTP
                </button>
                <button onClick={handleRequestOtp} className={btnGhost}>
                  <RefreshCw size={12} /> Resend OTP
                </button>
              </div>
            )}

            {/* ── STEP: Set new MPIN ── */}
            {step === 'set-mpin' && (
              <div className="space-y-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ OTP verified! Create your 4-digit MPIN.</p>
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">New MPIN</label>
                  <input type="password" maxLength={4} value={newMpin}
                    onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, ''))}
                    className={inputCls} placeholder="••••" autoFocus />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Confirm MPIN</label>
                  <input type="password" maxLength={4} value={confirmMpin}
                    onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))}
                    className={inputCls} placeholder="••••" />
                </div>
                <button
                  onClick={handleSetMpin}
                  disabled={newMpin.length < 4 || confirmMpin.length < 4 || localLoading}
                  className={btnPrimary}
                >
                  {localLoading ? 'Setting MPIN…' : 'Set MPIN & Confirm'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
