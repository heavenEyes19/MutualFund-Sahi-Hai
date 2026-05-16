import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWalletDetails, initiateTopup, verifyTopup, initiateWithdraw, verifyWithdraw } from '../../services/walletService';
import { ArrowUpRight, ArrowDownLeft, Plus, Wallet as WalletIcon, Clock, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

// Note: To implement Razorpay checkout properly, we need to load the razorpay script in index.html
// and use it here.

const WalletDropdown = ({ onClose }) => {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('main'); // main, add, withdraw, withdraw-otp
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleAddMoney = async () => {
    setError('');
    setSuccess('');
    if (!amount || isNaN(amount) || amount < 100) {
      setError("Minimum ₹100 required.");
      return;
    }
    try {
      const orderData = await initiateTopup(amount);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Snsc6Pg1LbIYVH', // fallback
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MutualFund Sahi Hai',
        description: 'Wallet Top-up',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verification = await verifyTopup({
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
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError("Payment failed: " + response.error.description);
      });
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate top-up");
    }
  };

  const handleWithdrawInitiate = async () => {
    setError('');
    setSuccess('');
    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amount > wallet.balance) {
      setError("Insufficient balance.");
      return;
    }
    try {
      await initiateWithdraw(amount, "Saved Bank Account");
      setActiveView('withdraw-otp');
      setSuccess("OTP sent to your email!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate withdrawal");
    }
  };

  const handleWithdrawVerify = async () => {
    setError('');
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    try {
      await verifyWithdraw(otp);
      setSuccess("Withdrawal processed successfully! Takes 1-2 days.");
      setAmount('');
      setOtp('');
      fetchDetails();
      setTimeout(() => setActiveView('main'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-3 w-80 bg-[#1e1e24] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200"
    >
      {/* Header */}
      <div className="bg-indigo-600 p-5 pb-6 rounded-t-2xl">
        <p className="text-xs text-indigo-100 font-medium mb-1">available balance</p>
        <div className="flex items-end gap-2">
          <h2 className="text-3xl font-bold text-white">₹{isLoading ? '...' : (wallet.balance || 0).toLocaleString()}</h2>
        </div>
        <p className="text-[10px] text-indigo-200 mt-1">last updated just now</p>
      </div>

      {activeView === 'main' && (
        <div className="p-4">
          <div className="flex gap-2 mb-6 -mt-3 relative z-10">
            <button 
              onClick={() => { setActiveView('add'); setError(''); setSuccess(''); }}
              className="flex-1 bg-[#1c5d2c] hover:bg-[#237036] text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={16} /> Add money
            </button>
            <button 
              onClick={() => { setActiveView('withdraw'); setError(''); setSuccess(''); }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowUpRight size={16} className="text-slate-400" /> Withdraw
            </button>
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent</h3>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center text-sm text-slate-500 py-4">Loading...</p>
            ) : wallet.transactions.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No transactions yet.</p>
            ) : (
              wallet.transactions.slice(0, 3).map((tx) => (
                <div key={tx._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'TOPUP' ? 'bg-[#1c5d2c]/20 text-[#4ade80]' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {tx.type === 'TOPUP' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{tx.description}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === 'TOPUP' ? 'text-[#4ade80]' : 'text-rose-400'}`}>
                    {tx.type === 'TOPUP' ? '+' : '−'}₹{tx.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="mt-5 text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1 transition-colors">
            View full history <ChevronRight size={14} />
          </button>
        </div>
      )}

      {activeView === 'add' && (
        <div className="p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Add Money to Wallet</h3>
          {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
          <div className="mb-4">
            <label className="text-xs text-slate-400 block mb-1">Amount (₹)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. 1000"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('main')}
              className="flex-1 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddMoney}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      )}

      {activeView === 'withdraw' && (
        <div className="p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Withdraw to Bank</h3>
          {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
          <div className="mb-4">
            <label className="text-xs text-slate-400 block mb-1">Amount (₹)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder={`Max ₹${wallet.balance}`}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('main')}
              className="flex-1 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleWithdrawInitiate}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Send OTP
            </button>
          </div>
        </div>
      )}

      {activeView === 'withdraw-otp' && (
        <div className="p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-2">Verify Withdrawal</h3>
          <p className="text-xs text-slate-400 mb-4">Enter the 6-digit OTP sent to your email to confirm the withdrawal of ₹{amount}.</p>
          {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
          {success && <p className="text-xs text-emerald-400 mb-2">{success}</p>}
          <div className="mb-4">
            <input 
              type="text" 
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 tracking-[0.5em] text-center text-lg font-mono"
              placeholder="••••••"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('main')}
              className="flex-1 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleWithdrawVerify}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Verify & Withdraw
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WalletDropdown;
