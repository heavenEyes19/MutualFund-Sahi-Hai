import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Lock } from 'lucide-react';
import API from '../../services/api';

/**
 * MpinModal — secure 4-digit MPIN verification overlay
 *
 * Props:
 *  - isOpen      : bool
 *  - onClose     : fn   — called on cancel / backdrop click
 *  - onVerified  : fn   — called after successful MPIN verification
 *  - title       : string  (optional)
 *  - subtitle    : string  (optional)
 */
export default function MpinModal({
  isOpen,
  onClose,
  onVerified,
  title = 'Confirm with MPIN',
  subtitle = 'Enter your 4-digit MPIN to authorise this transaction.',
}) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  // Reset state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError('');
      setLoading(false);
      setShake(false);
      // Focus first input after animation settles
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    }
  }, [isOpen]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }, []);

  const handleChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...digits];
    next[idx] = value;
    setDigits(next);
    setError('');
    if (value && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'Enter') handleSubmit();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(''));
      inputRefs.current[3]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async () => {
    const mpin = digits.join('');
    if (mpin.length < 4) {
      setError('Please enter all 4 digits.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await API.post('/users/verify-mpin', { mpin });
      onVerified();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.msg || 'Incorrect MPIN. Please try again.';
      setError(msg);
      setDigits(['', '', '', '']);
      triggerShake();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/70 dark:bg-slate-950/85 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="ui-card relative w-full max-w-sm p-8 text-center overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg p-1"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-[22px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Lock size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1.5">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">{subtitle}</p>

            {/* PIN inputs */}
            <motion.div
              animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center gap-4 mb-6"
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={`w-14 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all
                    bg-slate-50 dark:bg-slate-900
                    text-slate-900 dark:text-white
                    ${error
                      ? 'border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                      : d
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500'
                    }`}
                />
              ))}
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-bold text-rose-500 dark:text-rose-400 mb-5 uppercase tracking-widest"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || digits.join('').length < 4}
                className="flex-1 py-3.5 text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Confirm
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest mt-5">
              Protected by MPIN · End-to-End Secure
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
