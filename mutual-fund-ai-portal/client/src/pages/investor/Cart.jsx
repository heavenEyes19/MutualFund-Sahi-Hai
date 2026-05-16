import React, { useState } from 'react';
import { ShoppingCart, ArrowRight, Trash2, CreditCard, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/useCartStore';
import { createRazorpayOrder, verifyRazorpayPayment, createSIP, getPortfolio } from '../../services/portfolio';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart, getTotalCost } = useCartStore();
  
  const [txLoading, setTxLoading] = useState(false);
  const [txMessage, setTxMessage] = useState(null);

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

      // Process Lumpsum together in one Razorpay order
      if (lumpsumItems.length > 0) {
        const totalLumpsumAmount = lumpsumItems.reduce((acc, i) => acc + Number(i.amount), 0);
        const order = await createRazorpayOrder(totalLumpsumAmount);
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Snsc6Pg1LbIYVH",
          amount: order.amount,
          currency: "INR",
          name: "Mutual Fund Sahi Hai",
          description: `Buy ${lumpsumItems.length} Funds`,
          order_id: order.id,
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: lumpsumItems.map(item => ({
                  schemeCode: item.schemeCode,
                  schemeName: item.schemeName,
                  amount: item.amount,
                  nav: item.nav
                }))
              });
              
              setTxMessage({ type: 'success', text: 'Purchase successful!' });
              items.forEach(i => removeFromCart(i.schemeCode));
            } catch (err) {
              setTxMessage({ type: 'error', text: "Payment verification failed" });
            }
          },
          theme: { color: "#3b82f6" }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response){
          setTxMessage({ type: 'error', text: response.error.description });
          setTxLoading(false);
        });
        rzp1.open();
        return; // wait for razorpay callback to finish loading state
      }

      setTxMessage({ type: 'success', text: 'Purchase successful!' });
      items.forEach(i => removeFromCart(i.schemeCode));
    } catch (err) {
      setTxMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process purchase.' });
    } finally {
      setTxLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingCart size={40} className="text-slate-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Your cart is empty</h1>
          <p className="text-slate-500 font-medium mb-8">
            Looks like you haven't added any mutual funds to your cart yet. Discover trending funds or AI recommendations to get started.
          </p>
          <button 
            onClick={() => navigate('/dashboard-area/mutual-funds')}
            className="inline-flex items-center justify-center gap-2 w-full bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors"
          >
            Explore Funds <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] pb-24 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Your Cart</h1>
            <p className="text-slate-500 font-medium text-sm">{cartItems.length} funds ready for investment</p>
          </div>
          {txMessage && (
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold border ${txMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              {txMessage.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              <span>{txMessage.text}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.schemeCode} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate mb-1">{item.schemeName}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${item.type === 'SIP' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  disabled={txLoading}
                  onClick={() => handleBuySingle(item)}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  Buy only this
                </button>
                <button
                  disabled={txLoading}
                  onClick={() => removeFromCart(item.schemeCode)}
                  className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-transparent hover:border-red-100"
                  aria-label="Remove"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Buy All Section */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm mt-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 blur-[50px] pointer-events-none rounded-full"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <p className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-1">Total Investment</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">₹{getTotalCost().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              disabled={txLoading}
              onClick={handleBuyAll}
              className={`w-full md:w-auto px-10 py-4 rounded-xl text-white font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${txLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 hover:-translate-y-0.5'}`}
            >
              <CreditCard size={18} />
              {txLoading ? 'PROCESSING...' : 'BUY ALL'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
