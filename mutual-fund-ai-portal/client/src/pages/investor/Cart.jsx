import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-[#FAFAF7] dark:bg-[#111111] overflow-y-auto p-6 lg:p-12">
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <div className="w-24 h-24 bg-white dark:bg-[#1A1A1A] border border-[#EAE7DF] dark:border-[#333] rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <ShoppingCart size={40} className="text-slate-300 dark:text-slate-600" />
        </div>
        
        <h1 className="text-4xl font-serif text-[#333] dark:text-[#EEE] mb-4">Your cart is empty</h1>
        <p className="text-slate-500 dark:text-slate-400 font-sans max-w-md mx-auto mb-10">
          Looks like you haven't added any mutual funds to your cart yet. Discover trending funds or AI recommendations to get started.
        </p>

        <button 
          onClick={() => navigate('/dashboard-area/mutual-funds')}
          className="inline-flex items-center gap-2 bg-[#2A2A2A] dark:bg-[#EAEAEA] text-white dark:text-[#111] px-8 py-3.5 rounded-xl font-sans font-medium hover:bg-black dark:hover:bg-white transition-colors"
        >
          Explore Funds <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
