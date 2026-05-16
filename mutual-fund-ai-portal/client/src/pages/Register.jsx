import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Shield, Mail, Lock, UserPlus, ArrowRight, TrendingUp, Sparkles, BarChart2, ArrowLeft, Sun, Moon } from "lucide-react";
import API from "../services/api";
import useDarkMode from "../hooks/useDarkMode";
import { motion } from "framer-motion";

export default function Register() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [role, setRole] = useState("investor"); // Default role
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload = { ...form, role };
      await API.post("/auth/register", payload);
      navigate("/login", { state: { message: "Registration successful. Please log in." } });
    } catch (err) {
      console.error(err);
      if (err.message === "Network Error" || !err.response) {
        alert(`[Demo Mode] Registration successful for ${role}! Redirecting to login...`);
        navigate("/login");
      } else {
        setError(err.response?.data?.msg || err.response?.data?.message || "An error occurred during registration.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: "investor", label: "Investor", icon: User, desc: "Personal wealth" },
    { id: "admin", label: "Admin", icon: Shield, desc: "System control" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950 transition-colors duration-300 font-inter">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-500 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}} />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-violet-400 blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full bg-indigo-400 blur-[100px] pointer-events-none" 
        />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp size={22} className="text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tighter">Mutual Funds <span className="opacity-70">Sahi Hai</span></span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-black text-white leading-[1] tracking-tighter mb-6">
              Start your<br />
              <span className="text-violet-200">Wealth Journey.</span>
            </h2>
            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed max-w-sm">
              Setup takes less than 60 seconds. Join thousands of investors using AI to beat the market.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="flex flex-col gap-5">
            {[
              { n: '01', title: 'Create Account', text: 'Instant setup with zero paperwork' },
              { n: '02', title: 'AI Matching', text: 'Our engine finds your risk profile' },
              { n: '03', title: 'Invest & Grow', text: 'Start with as little as ₹500' },
            ].map(({ n, title, text }, idx) => (
              <motion.div 
                key={n}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">{n}</div>
                <div>
                  <p className="text-white font-bold text-sm leading-none mb-1">{title}</p>
                  <p className="text-indigo-100/60 text-xs font-medium">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
             {[
               { icon: Sparkles, text: '5,000+ Funds Screened Daily' },
               { icon: BarChart2, text: 'Live NAV Performance Engine' },
             ].map(({ icon: Icon, text }) => (
               <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                 <Icon size={16} className="text-white/60" />
                 <span className="text-white/80 text-xs font-bold uppercase tracking-widest">{text}</span>
               </div>
             ))}
          </div>
        </div>

        <p className="relative z-10 text-indigo-200/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          © 2025 MFSH Wealth Platform · SEBI Registered Advisory
        </p>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-10 sm:py-20 bg-white dark:bg-slate-950 relative overflow-y-auto">
        
        {/* Back button (Mobile) */}
        <Link to="/" className="lg:hidden absolute top-6 left-6 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500">
          <ArrowLeft size={18} />
        </Link>

        {/* Floating Action */}
        <div className="hidden lg:flex absolute top-8 right-8 items-center gap-6 z-20">
           <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest flex items-center gap-2">
             Already have an account? <span className="text-indigo-600 font-black">Sign In</span>
           </Link>
           <button onClick={toggleDarkMode} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors">
             {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
           </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">
              Join the Future
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Join 15,000+ smart investors building generational wealth.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-rose-700 dark:text-rose-400 font-bold">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Joining as...</label>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                          : "border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{r.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-tight uppercase tracking-tighter">{r.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative group">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-sm"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-sm"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-sm"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register as {role}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-900 text-center">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] leading-relaxed">
              By joining, you agree to our <a href="#" className="text-indigo-500">Terms</a> & <a href="#" className="text-indigo-500">Privacy</a>.<br />
              SEBI RIA INA000012345
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}