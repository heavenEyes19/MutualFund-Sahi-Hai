import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog — themed replacement for window.confirm
 *
 * Props:
 *  - isOpen       : bool
 *  - onClose      : fn
 *  - onConfirm    : fn
 *  - title        : string
 *  - message      : string | ReactNode
 *  - confirmLabel : string  (default "Confirm")
 *  - cancelLabel  : string  (default "Cancel")
 *  - variant      : 'danger' | 'warning' | 'info'
 *  - isLoading    : bool
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  const variantConfig = {
    danger: {
      iconBg: 'bg-rose-50 dark:bg-rose-500/10',
      iconColor: 'text-rose-500 dark:text-rose-400',
      btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
    },
    warning: {
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-500 dark:text-amber-400',
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
    },
    info: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
    },
  };

  const cfg = variantConfig[variant] || variantConfig.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="ui-card relative w-full max-w-sm p-8 text-center"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${cfg.iconBg}`}>
              <AlertTriangle size={26} className={cfg.iconColor} />
            </div>

            {/* Text */}
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
            {message && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7 leading-relaxed">{message}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 ${cfg.btn}`}
              >
                {isLoading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
