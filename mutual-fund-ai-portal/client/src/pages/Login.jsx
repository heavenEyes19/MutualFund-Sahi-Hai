import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle, TrendingUp, Sparkles, BarChart2, Shield, ArrowLeft, Sun, Moon } from "lucide-react";
import API from "../services/api";
import useAuthStore from "../store/useAuthStore";
import useDarkMode from "../hooks/useDarkMode";
import { motion } from "framer-motion";

export default function Login() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const mockLogin = useAuthStore((state) => state.mockLogin);

  // Show message from registration if available
  const successMessage = location.state?.message || "";

  const getDashboardPath = (role) => {
    switch (role) {
      case "admin":
        return "/dashboard-area/analytics";
      case "investor":
      default:
        return "/dashboard-area/explore";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (step === 1) {
        const res = await API.post("/auth/login", { email: form.email, password: form.password });
        
        if (res.data.requiresOtp) {
          setStep(2);
        } else {
          const { token, ...userData } = res.data;
          login(userData || { email: form.email, role: userData.role }, token);
          navigate(getDashboardPath(userData.role));
        }
      } else {
        const res = await API.post("/auth/verify-otp", { email: form.email, otp: form.otp });
        
        const { token, ...userData } = res.data;
        login(userData || { email: form.email, role: userData.role }, token);
        navigate(getDashboardPath(userData.role));
      }
    } catch (err) {
      console.error(err);
      
      // Fallback demo mode logic if backend is down
      if (err.message === "Network Error" || !err.response) {
        let demoRole = "investor";
        if (form.email.includes("admin")) demoRole = "admin";

        mockLogin(demoRole);
        alert(`[Demo Mode] Logged in as ${demoRole}!`);
        navigate(getDashboardPath(demoRole));
      } else {
        setError(err.response?.data?.msg || err.response?.data?.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950 transition-colors duration-300 font-inter`}>

      {/* ── LEFT PANEL — Brand + Brand Image (Hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex-col justify-between p-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}} />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-indigo-400 blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full bg-violet-400 blur-[100px] pointer-events-none" 
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
              Empower your<br />
              <span className="text-indigo-200">Financial Future.</span>
            </h2>
            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed max-w-sm">
              Experience the next generation of mutual fund investing with AI-driven precision and bank-grade security.
            </p>
          </motion.div>

          {/* Feature List */}
          <div className="flex flex-col gap-4">
            {[
              { icon: Sparkles, text: 'AI-Guided fund recommendations' },
              { icon: BarChart2, text: 'Live performance tracking engine' },
              { icon: Shield, text: 'Zero-trust architecture security' },
            ].map(({ icon: Icon, text }, idx) => (
              <motion.div 
                key={text} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/10 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-white font-bold text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stats block */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-10 border-t border-white/10">
          {[
            ['₹2,400Cr+', 'AUM Analyzed'],
            ['15K+', 'Active Users'],
            ['18.4%', 'Avg. Growth']
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-white font-black text-xl tracking-tight">{v}</p>
              <p className="text-indigo-200/60 text-[10px] font-bold uppercase tracking-widest">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-10 sm:py-20 bg-white dark:bg-slate-950 relative overflow-hidden">
        
        {/* Back button (Mobile only) */}
        <Link to="/" className="lg:hidden absolute top-6 left-6 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500">
          <ArrowLeft size={18} />
        </Link>

        {/* Dark mode toggle (floating for login) */}
        <div className="hidden lg:flex absolute top-8 right-8 items-center gap-6 z-20">
           <Link to="/" className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest flex items-center gap-2">
             <ArrowLeft size={14} /> Back to Website
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
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">
              {step === 1 ? 'Welcome Back' : 'Verify Identity'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {step === 1 ? "Don't have an account? " : `We've sent an OTP to ${form.email}. `}
              {step === 1 && (
                <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  Create one for free
                </Link>
              )}
            </p>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-rose-700 dark:text-rose-400 font-bold">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-sm"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Password</label>
                    <Link to="#" className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:underline">Forgot?</Link>
                  </div>
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
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Security Code</label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-5 text-center tracking-[0.6em] font-black text-2xl outline-none transition-all"
                    placeholder="000000"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <button type="button" className="text-xs font-bold text-indigo-500 hover:underline">Resend OTP in 30s</button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {step === 1 ? 'Processing...' : 'Verifying...'}
                </>
              ) : (
                <>
                  {step === 1 ? 'Sign In' : 'Complete Login'}
                  <LogIn size={18} />
                </>
              )}
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Use different email
              </button>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-900 text-center">
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] leading-relaxed">
              Secure access provided by MFSH Auth Service.<br />
              Encryption: AES-256-GCM · SEBI Certified
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}