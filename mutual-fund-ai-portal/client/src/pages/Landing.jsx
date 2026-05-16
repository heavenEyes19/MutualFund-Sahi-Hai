import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Zap, BarChart2, Star, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Decorative SVG illustrations inline ─── */
const HeroIllustration = () => (
  <div className="relative w-full max-w-[420px] mx-auto select-none">
    {/* Outer glow blob */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-cyan-500/10 blur-3xl scale-110 pointer-events-none" />

    {/* Main card stack */}
    <div className="relative flex flex-col gap-4 p-2 sm:p-4">

      {/* Portfolio card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="ui-card rounded-3xl p-5 sm:p-6 relative overflow-hidden dark:bg-slate-900/80 backdrop-blur-sm shadow-2xl border-indigo-500/10 dark:border-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-[80px]" />
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Total Portfolio</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white" style={{fontVariantNumeric:'tabular-nums'}}>₹4,82,310</p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp size={24} className="text-white" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100/50 dark:border-emerald-500/20">
            <span className="text-[10px]">▲</span> +14.9% 
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Verified by AI insights</span>
        </div>
        {/* Mini sparkline */}
        <svg className="mt-6 w-full" height="50" viewBox="0 0 300 50" fill="none">
          <defs>
            <linearGradient id="spark1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0 45 Q30 38 60 32 Q90 28 120 22 Q150 18 180 14 Q210 10 240 6 Q270 4 300 2" stroke="#6366f1" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M0 45 Q30 38 60 32 Q90 28 120 22 Q150 18 180 14 Q210 10 240 6 Q270 4 300 2 L300 50 L0 50 Z" fill="url(#spark1)"/>
        </svg>
      </motion.div>

      {/* Two small cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="ui-card rounded-2xl p-4 sm:p-5 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
            <BarChart2 size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Active SIPs</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">6</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Running</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="ui-card rounded-2xl p-4 sm:p-5 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
            <Zap size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">XIRR</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">18.4%</p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 font-bold uppercase tracking-tighter">Annualised</p>
        </motion.div>
      </div>

      {/* AI insight card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="ui-card rounded-2xl p-4 sm:p-5 flex items-start gap-4 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl"
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">AI Advisor</p>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">"Your portfolio is healthy. Diversify into mid-caps for optimized growth."</p>
        </div>
      </motion.div>
    </div>
  </div>
);

const Feature = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: delay / 1000 }}
    className="ui-card p-6 sm:p-8 flex flex-col gap-5 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all hover:scale-[1.02] group"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

const Stat = ({ value, label, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: delay / 1000 }}
    className="text-center lg:text-left shrink-0"
  >
    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{label}</p>
  </motion.div>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden font-inter">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-black text-slate-900 dark:text-white text-[16px] sm:text-[18px] tracking-tighter">Mutual Funds <span className="text-indigo-500">Sahi Hai</span></span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {['Features', 'About', 'Security', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all font-bold">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-bold text-white rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-40 dark:opacity-20" style={{background: 'radial-gradient(ellipse at center, #6366f1 0%, rgba(99,102,241,0) 70%)'}} />
          <div className="absolute top-48 -left-20 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px]" />
          <div className="absolute top-64 -right-20 w-80 h-80 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[100px]" />
          {/* Animated Grid pattern */}
          <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]" style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left text */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Next-Gen AI Wealth Intelligence Now Live
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter text-slate-900 dark:text-white mb-8"
              >
                Invest with<br />
                <span className="gradient-text">AI Precision</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 font-medium"
              >
                Analyze thousands of mutual funds in seconds, track performance with real-time data, and build generational wealth with AI-guided strategies.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 transition-all"
                >
                  Get Started Free <ArrowRight size={20} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-300 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xl"
                >
                  View Demo
                </Link>
              </motion.div>

              {/* Stats row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-12 gap-y-8 mt-16 pt-12 border-t border-slate-100 dark:border-slate-900">
                <Stat value="₹2,400 Cr+" label="AUM Analyzed" delay={400} />
                <Stat value="15,000+" label="Smart Investors" delay={500} />
                <Stat value="18.4%" label="Avg. Portfolio Growth" delay={600} />
              </div>
            </div>

            {/* Right illustration */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1 }}
              className="flex-1 w-full max-w-lg lg:max-w-none perspective-1000"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY SECTION ── */}
      <section className="py-12 border-y border-slate-50 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] text-center md:text-left shrink-0">Supported By Top AMCs</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-30 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              {['HDFC MUTUAL', 'SBI FUNDS', 'AXIS ASSET', 'MIRAE ASSET', 'ICICI PRUDENTIAL', 'NIPPON LIFE'].map(brand => (
                <span key={brand} className="text-sm sm:text-base font-black text-slate-800 dark:text-white whitespace-nowrap">{brand}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4"
            >
              The Edge You Need
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter"
            >
              Futuristic Investing, <span className="text-indigo-500">Simplified</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-slate-500 dark:text-slate-400 mt-6 text-lg max-w-2xl mx-auto font-medium"
            >
              We've replaced manual spreadsheets and outdated tracking with a unified, AI-first platform designed for the modern wealth builder.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature delay={0} icon={Sparkles} color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" title="AI Screener" desc="Instantly filter 5,000+ funds based on deep-learning risk patterns and sector momentum." />
            <Feature delay={100} icon={Zap} color="bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" title="Real-time Engine" desc="Live NAV pulse, instant portfolio impact analysis, and smart goal-tracking alerts." />
            <Feature delay={200} icon={BarChart2} color="bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" title="Auto-Balancing" desc="Get precise trade recommendations when your portfolio drifts from your target risk profile." />
            <Feature delay={300} icon={Shield} color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Fort Knox Security" desc="Bank-grade AES-256 encryption with zero-trust architecture. Your assets are safe." />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="security" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/30 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">Your Path to <span className="text-indigo-500">Wealth</span></h2>
          </div>
          <div className="relative">
            <div className="absolute top-12 left-0 right-0 h-1 bg-indigo-100 dark:bg-indigo-900 hidden md:block rounded-full overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
               />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { step: '01', title: 'Connect', desc: 'Securely link your existing portfolio or start fresh in under 60 seconds.' },
                { step: '02', title: 'Analyze', desc: 'Let our AI scan your profile to find hidden risks and growth opportunities.' },
                { step: '03', title: 'Optimize', desc: 'Execute recommended trades and watch your wealth grow with automation.' },
              ].map(({ step, title, desc }, idx) => (
                <motion.div 
                  key={step} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="text-center flex flex-col items-center group"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-white dark:bg-slate-900 border-4 border-indigo-50 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl sm:text-3xl mb-6 shadow-2xl relative z-10 group-hover:rotate-6 transition-transform">
                    {step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { name: 'Priya Sharma', role: 'Software Engineer', text: 'The AI recommendations predicted a 15% growth for my mid-cap allocation, and they were spot on. The best UI I have seen in Indian FinTech.', stars: 5 },
              { name: 'Rahul Gupta', role: 'Startup Founder', text: 'Finally, a platform that doesn\'t look like it was made in the 90s. Clean, fast, and the AI advisory is genuinely world-class.', stars: 5 },
              { name: 'Ananya Patel', role: 'Physician', text: 'As a busy doctor, I don\'t have time to research 5,000 funds. MFSH does the heavy lifting for me while I stay in control.', stars: 5 },
            ].map(({ name, role, text, stars }, idx) => (
              <motion.div 
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="ui-card p-8 sm:p-10 flex flex-col dark:bg-slate-900/40"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({length: stars}).map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-8 flex-1 italic">"{text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[48px] overflow-hidden p-10 sm:p-20 bg-slate-900 dark:bg-indigo-600 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.5)]">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
            <div className="relative z-10 text-center lg:text-left">
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-6">Secure your future,<br /> <span className="opacity-60">starting now.</span></h2>
              <p className="text-indigo-100/70 text-lg sm:text-xl max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">Join 15,000+ investors building their dream portfolios with AI. Zero hidden fees. 100% Transparency.</p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
               <Link
                to="/register"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-indigo-600 font-black text-lg rounded-[24px] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Join Now <ArrowRight size={22} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 sm:py-20 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <TrendingUp size={22} className="text-white" />
              </div>
              <span className="font-black text-slate-900 dark:text-white text-xl tracking-tighter">Mutual Funds <span className="text-indigo-500">Sahi Hai</span></span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {['Terms', 'Privacy', 'Compliance', 'Security', 'Contact'].map(item => (
                <a key={item} href="#" className="text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors uppercase tracking-widest">{item}</a>
              ))}
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Made with Precision</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-700">© 2025 MFSH Ltd. SEBI INA000012345</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}