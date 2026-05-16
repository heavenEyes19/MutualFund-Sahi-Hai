import React, { useState } from 'react';
import { ShoppingCart, ArrowRight, Trash2, CreditCard, CheckCircle2, ShieldAlert, Sparkles, Zap, Calendar, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/useCartStore';
import { createSIP } from '../../services/portfolio';
import API from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart, getTotalCost } = useCartStore();
  
  const [txLoading, setTxLoading] = useState(false);
  const [txMessage, setTxMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingItems, setPendingItems] = useState([]);

  const handleBuySingle = async (item) => {
    await processPurchase([item]);
  };

  const handleBuyAll = async () => {
    if (cartItems.length === 0) return;
    await processPurchase(cartItems);
  };

  const processPurchase = async (items) => {
    setTxLoading(true);
    setTxMessage(null);
    try {
      const sipItems = items.filter(i => i.type === 'SIP');
      const lumpsumItems = items.filter(i => i.type === 'LUMPSUM');

      // Process SIPs sequentially
      for (const sip of sipItems) {
        await createSIP({
          schemeCode: Number(sip.schemeCode),
          schemeName: sip.schemeName,
          amount: Number(sip.amount),
          nav: sip.nav,
          startDate: new Date().toISOString(),
          durationMonths: Number(sip.duration) || 12
        });
      }

      // Process Lumpsum with Wallet OTP
      if (lumpsumItems.length > 0) {
        const totalLumpsumAmount = lumpsumItems.reduce((acc, i) => acc + Number(i.amount), 0);
        
        await API.post('/payment/create-order', {
          amount: totalLumpsumAmount,
          items: lumpsumItems.map(item => ({
            schemeCode: item.schemeCode,
            schemeName: item.schemeName,
            amount: item.amount,
            nav: item.nav
          }))
        });

        setPendingItems(lumpsumItems);
        setShowOtpModal(true);
        setTxLoading(false);
        return; 
      }

      setTxMessage({ type: 'success', text: 'Deployment Successful!' });
      items.forEach(i => removeFromCart(i.schemeCode));
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response?.data?.message?.toLowerCase().includes("insufficient wallet balance")) {
        setTxMessage({ type: 'error', text: "Insufficient balance. Please top up your wallet." });
      } else {
        setTxMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process deployment.' });
      }
    } finally {
      setTxLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setTxLoading(true);
    setTxMessage(null);
    try {
      await API.post('/payment/verify-payment', { otp });
      setShowOtpModal(false);
      setOtp('');
      setTxMessage({ type: 'success', text: 'Deployment Successful!' });
      pendingItems.forEach(i => removeFromCart(i.schemeCode));
      setShowSuccessModal(true);
    } catch (err) {
      setTxMessage({ type: 'error', text: err.response?.data?.message || 'Failed to verify OTP.' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setTxMessage(null);
      const totalLumpsumAmount = pendingItems.reduce((acc, i) => acc + Number(i.amount), 0);
      await API.post('/payment/create-order', {
        amount: totalLumpsumAmount,
        items: pendingItems.map(item => ({
          schemeCode: item.schemeCode,
          schemeName: item.schemeName,
          amount: item.amount,
          nav: item.nav
        }))
      });
      setTxMessage({ type: 'success', text: 'OTP resent to your email!' });
    } catch (err) {
      setTxMessage({ type: 'error', text: err.response?.data?.message || 'Failed to resend OTP.' });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-6 font-inter">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="relative inline-block mb-10">
            <div className="w-32 h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-slate-200/50 dark:shadow-none">
              <ShoppingCart size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl"
            >
              <Sparkles size={18} />
            </motion.div>
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Empty Terminal</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
            Your investment cart is empty. Leverage our neural networks to discover high-yield opportunities.
          </p>
          
          <button 
            onClick={() => navigate('/dashboard-area/explore')}
            className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            Launch AI Discovery <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-24 p-4 lg:p-8 font-inter">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Checkout Terminal</p>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Your Investment <span className="text-indigo-600">Cart</span></h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">{cartItems.length} schemes ready for deployment</p>
          </div>
          
          {txMessage && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-tight border ${txMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}
            >
              {txMessage.type === 'success' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              <span>{txMessage.text}</span>
            </motion.div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence mode='popLayout'>
              {cartItems.map((item) => (
                <motion.div 
                  key={item.schemeCode}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="ui-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${item.type === 'SIP' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                      {item.schemeName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 dark:text-white text-sm line-clamp-1 mb-1">{item.schemeName}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${item.type === 'SIP' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20'}`}>
                          {item.type}
                        </span>
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-600 tabular-nums">NAV ₹{item.nav}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="text-right flex-1 sm:flex-none mr-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Amount</p>
                       <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">₹{item.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={txLoading}
                        onClick={() => handleBuySingle(item)}
                        className="h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                        DEPLOY
                      </button>
                      <button
                        disabled={txLoading}
                        onClick={() => removeFromCart(item.schemeCode)}
                        className="w-12 h-12 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4">
            <div className="ui-card p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 border-none shadow-2xl shadow-indigo-500/30 sticky top-32 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[60px] pointer-events-none rounded-full" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <Wallet size={20} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Capital Deployment</p>
                </div>

                <div className="mb-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Total Investment Value</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter tabular-nums">₹{getTotalCost().toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    disabled={txLoading}
                    onClick={handleBuyAll}
                    className="w-full py-5 bg-white text-indigo-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {txLoading ? (
                       <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                    ) : (
                      <><CreditCard size={18} /> EXECUTE ALL ORDERS</>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/dashboard-area/mutual-funds')}
                    className="w-full py-3 text-indigo-100 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    ADD MORE FUNDS
                  </button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest">SECURE RAZORPAY GATEWAY</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest">AI-OPTIMIZED EXECUTION</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="relative bg-white dark:bg-slate-900 rounded-[40px] p-12 text-center max-w-sm shadow-2xl">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/40">
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Capital Deployed</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed text-sm">Your mutual fund orders have been successfully transmitted and are being processed.</p>
              <button 
                onClick={() => { setShowSuccessModal(false); navigate('/dashboard-area/portfolio'); }}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl"
              >
                Go to Portfolio
              </button>
            </motion.div>
          </div>
        )}

        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="relative bg-white dark:bg-slate-900 rounded-[30px] p-8 max-w-sm w-full shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Verify Purchase</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Enter the 6-digit OTP sent to your email to confirm the debit from your wallet.</p>
              
              {txMessage && (
                <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${txMessage.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {txMessage.text}
                </div>
              )}

              <input 
                type="text" 
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl p-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-indigo-500 mb-4"
                placeholder="••••••"
              />

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setShowOtpModal(false); setOtp(''); setPendingItems([]); }}
                  className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVerifyOtp}
                  disabled={txLoading || otp.length < 6}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  {txLoading ? "Verifying..." : "Verify & Pay"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button 
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-600"
                >
                  Resend OTP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
