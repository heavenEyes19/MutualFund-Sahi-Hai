import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWalletDetails, initiateTopup, verifyTopup, initiateWithdraw, verifyWithdraw } from '../../services/walletService';
import { ArrowUpRight, ArrowDownLeft, Plus, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import MpinModal from './MpinModal';

const WalletDropdown = ({ onClose }) => {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('main'); // main, add, withdraw
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // MPIN modal state
  const [showMpin, setShowMpin] = useState(false);
  const [mpinLoading, setMpinLoading] = useState(false);
  const [mpinError, setMpinError] = useState('');
  const [isMpinSet, setIsMpinSet] = useState(true);
  const [pendingWithdraw, setPendingWithdraw] = useState(null); // { amount, bankAccount }

  const fetchDetails = async () => {
    try {
      const data = await getWalletDetails();
      setWallet(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, []);

  const handleAddMoney = async () => {
    setError(''); setSuccess('');
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      setError("Minimum ₹100 required.");
      return;
    }
    try {
      const orderData = await initiateTopup(amount);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Snsc6Pg1LbIYVH',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MutualFund Sahi Hai',
        description: 'Wallet Top-up',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await verifyTopup({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount)
            });
            setSuccess("Top-up successful!");
            setAmount('');
            fetchDetails();
            setActiveView('main');
          } catch (err) {
            setError(err.response?.data?.message || "Verification failed");
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#4f46e5' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => setError("Payment failed: " + response.error.description));
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate top-up");
    }
  };

  // Step 1: Validate amount & check isMpinSet
  const handleWithdrawInitiate = async () => {
    setError(''); setSuccess('');
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount."); return; }
    if (amt > wallet.balance) { setError("Insufficient balance."); return; }
    try {
      const res = await initiateWithdraw(amt, "Saved Bank Account");
      setPendingWithdraw({ amount: amt, bankAccount: "Saved Bank Account" });
      setIsMpinSet(res.isMpinSet);
      setMpinError('');
      setShowMpin(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate withdrawal");
    }
  };

  // Step 2: MPIN verified — call verifyWithdraw
  const handleMpinVerified = async (mpin) => {
    setMpinLoading(true); setMpinError('');
    try {
      await verifyWithdraw({ mpin, amount: pendingWithdraw.amount, bankAccount: pendingWithdraw.bankAccount });
      setShowMpin(false);
      setSuccess("Withdrawal processed! Takes 1-2 business days.");
      setAmount('');
      fetchDetails();
      setTimeout(() => setActiveView('main'), 2500);
    } catch (err) {
      setMpinError(err.response?.data?.message || "Verification failed");
    } finally {
      setMpinLoading(false);
    }
  };

  const txIsCredit = (type) => ['TOPUP', 'FUND_SALE'].includes(type);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-indigo-600 p-5 pb-6 rounded-t-2xl">
          <p className="text-xs text-indigo-100 font-medium mb-1">available balance</p>
          <h2 className="text-3xl font-bold text-white">₹{isLoading ? '...' : (wallet.balance || 0).toLocaleString()}</h2>
          <p className="text-[10px] text-indigo-200 mt-1">last updated just now</p>
        </div>

        {activeView === 'main' && (
          <>
            <div className="flex gap-2 mb-6 -mt-3 relative z-10 px-4">
              <button
                onClick={() => { setActiveView('add'); setError(''); setSuccess(''); }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Plus size={16} /> Add money
              </button>
              <button
                onClick={() => { setActiveView('withdraw'); setError(''); setSuccess(''); }}
                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <ArrowUpRight size={16} className="text-slate-400" /> Withdraw
              </button>
            </div>

            <div className="px-4">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-center text-sm text-slate-400 py-4">Loading...</p>
                ) : wallet.transactions.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4 font-medium">No transactions yet.</p>
                ) : (
                  wallet.transactions.slice(0, 3).map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${txIsCredit(tx.type) ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                          {txIsCredit(tx.type) ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-0.5">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-black tabular-nums ${txIsCredit(tx.type) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {txIsCredit(tx.type) ? '+' : '−'}₹{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button className="mt-6 w-full py-3 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 rounded-xl transition-all">
                View full history <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}

        {activeView === 'add' && (
          <div className="p-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Add Money to Wallet</h3>
            {error && <p className="text-xs text-rose-500 font-bold mb-3">{error}</p>}
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Min ₹100"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveView('main')} className="flex-1 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Cancel</button>
              <button onClick={handleAddMoney} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">Proceed to Pay</button>
            </div>
          </div>
        )}

        {activeView === 'withdraw' && (
          <div className="p-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Withdraw to Bank</h3>
            {error && <p className="text-xs text-rose-500 font-bold mb-3">{error}</p>}
            {success && <p className="text-xs text-emerald-500 font-bold mb-3">{success}</p>}
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder={`Max ₹${wallet.balance}`}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveView('main')} className="flex-1 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Cancel</button>
              <button onClick={handleWithdrawInitiate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">Confirm MPIN</button>
            </div>
          </div>
        )}
      </motion.div>

      <MpinModal
        isOpen={showMpin}
        onClose={() => { setShowMpin(false); setMpinError(''); }}
        onVerified={handleMpinVerified}
        title="Confirm Withdrawal"
        description={pendingWithdraw ? `Withdrawing ₹${Number(pendingWithdraw.amount).toLocaleString('en-IN')} to bank` : ''}
        isLoading={mpinLoading}
        error={mpinError}
        isMpinSet={isMpinSet}
      />
    </>
  );
};

export default WalletDropdown;
