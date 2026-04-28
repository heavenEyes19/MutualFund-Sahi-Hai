import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const GridPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.04]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f4c81" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

const DonutChart = () => {
  const segments = [
    { pct: 42, color: "#1a6fd4", label: "Equity" },
    { pct: 28, color: "#0da870", label: "Debt" },
    { pct: 18, color: "#f59e0b", label: "Hybrid" },
    { pct: 12, color: "#e05c3a", label: "ELSS" },
  ];

  const r = 52;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8edf3" strokeWidth="18" />
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circumference;
          const gap = circumference - dash;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          );
          offset += dash + 2;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fill="#64748b" fontFamily="'DM Sans', sans-serif">Returns</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="22" fontWeight="600" fill="#0f172a" fontFamily="'DM Sans', sans-serif">18.4%</text>
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MiniSparkline = ({ color, positive }) => {
  const points = positive
    ? "0,30 10,25 20,22 30,18 40,15 50,10 60,7 70,4 80,2"
    : "0,10 10,14 20,12 30,18 40,16 50,22 60,20 70,24 80,28";

  return (
    <svg width="80" height="32" viewBox="0 0 80 32">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const FundCard = ({ name, category, returns, positive, badge }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #e8edf3",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      boxShadow: "0 2px 12px rgba(15,76,129,0.06)",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{category}</p>
      </div>
      {badge && (
        <span style={{ fontSize: 10, background: "#eaf4ff", color: "#1a6fd4", borderRadius: 20, padding: "2px 8px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>3Y Returns</p>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: positive ? "#0da870" : "#e05c3a", fontFamily: "'DM Sans', sans-serif" }}>
          {positive ? "+" : ""}{returns}%
        </p>
      </div>
      <MiniSparkline color={positive ? "#0da870" : "#e05c3a"} positive={positive} />
    </div>
  </div>
);

const StatBadge = ({ icon, value, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
    <div style={{ fontSize: 22 }}>{icon}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>{label}</div>
  </div>
);

const PortfolioCard = () => (
  <div
    style={{
      background: "linear-gradient(135deg, #0f4c81 0%, #1a6fd4 60%, #0da870 100%)",
      borderRadius: 20,
      padding: "22px 22px 18px",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 16px 48px rgba(15,76,129,0.3)",
    }}
  >
    <div
      style={{
        position: "absolute", top: -30, right: -30, width: 120, height: 120,
        borderRadius: "50%", background: "rgba(255,255,255,0.07)",
      }}
    />
    <div
      style={{
        position: "absolute", bottom: -40, left: 20, width: 160, height: 160,
        borderRadius: "50%", background: "rgba(255,255,255,0.04)",
      }}
    />
    <p style={{ margin: 0, fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
      Total Portfolio Value
    </p>
    <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
      ₹4,82,310
    </p>
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
      <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
        ▲ +₹62,450 (14.9%)
      </span>
    </div>
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between" }}>
      {[["6 Funds", "Active"], ["SIP ₹12k", "Monthly"], ["XIRR 18.4%", "All time"]].map(([val, lbl]) => (
        <div key={lbl}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{val}</p>
          <p style={{ margin: 0, fontSize: 10, opacity: 0.65, fontFamily: "'DM Sans', sans-serif" }}>{lbl}</p>
        </div>
      ))}
    </div>
  </div>
);

const AiInsightCard = () => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #e8edf3",
      padding: "14px 16px",
      boxShadow: "0 2px 12px rgba(15,76,129,0.06)",
    }}
  >
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#1a6fd4,#0da870)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>AI Insight</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
          Your portfolio is overweight in large-cap. Consider rebalancing 15% into mid-cap for better risk-adjusted returns.
        </p>
      </div>
    </div>
  </div>
);

const FloatingUI = () => (
  <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "0 auto" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <PortfolioCard />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FundCard name="Mirae Asset" category="Large Cap" returns={22.4} positive={true} badge="Top Pick" />
        <FundCard name="SBI Contra" category="Contra Fund" returns={31.7} positive={true} />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e8edf3",
          padding: "16px 18px",
          boxShadow: "0 2px 12px rgba(15,76,129,0.06)",
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>Allocation</p>
        <DonutChart />
      </div>
      <AiInsightCard />
    </div>
  </div>
);

const Feature = ({ icon, title, desc }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "24px", background: "#fff", borderRadius: 16, border: "1px solid #e8edf3" }}>
    <div
      style={{
        width: 44, height: 44, borderRadius: 12,
        background: "linear-gradient(135deg, #eaf4ff 0%, #e0f7f0 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{title}</p>
    <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
  </div>
);

export default function Landing() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f7f9fc", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 6%", background: "rgba(247,249,252,0.85)",
          backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100,
          borderBottom: "1px solid #e8edf3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #0f4c81, #1a6fd4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 3v18h18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M7 16l4-5 4 3 5-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Mutual-Funds Sahi Hai</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            to="/login"
            style={{
              padding: "8px 18px", fontSize: 14, fontWeight: 500, color: "#1a6fd4",
              textDecoration: "none", borderRadius: 8,
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              padding: "9px 20px", fontSize: 14, fontWeight: 600, color: "#fff",
              textDecoration: "none", borderRadius: 10,
              background: "linear-gradient(135deg, #0f4c81, #1a6fd4)",
              boxShadow: "0 4px 14px rgba(26,111,212,0.35)",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "72px 6% 80px",
          display: "flex",
          gap: 48,
          alignItems: "center",
          maxWidth: 1200,
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        {/* BG decoration */}
        <div
          style={{
            position: "absolute", top: 40, left: "8%", width: 480, height: 480,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(26,111,212,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", top: 120, right: "4%", width: 300, height: 300,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(13,168,112,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Left text */}
        <div style={{ flex: "1 1 400px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#eaf4ff", borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 600, color: "#1a6fd4", marginBottom: 20,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0da870", display: "inline-block" }} />
            AI-Powered Fund Intelligence
          </div>

          <h1
            style={{
              margin: 0, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700,
              color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.03em",
              fontFamily: "'DM Serif Display', serif",
            }}
          >
            Invest Smarter with{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #1a6fd4, #0da870)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
            >
              AI-driven
            </span>{" "}
            Mutual Fund Insights
          </h1>

          <p
            style={{
              margin: "20px 0 0", fontSize: 16, color: "#64748b", lineHeight: 1.7, maxWidth: 480,
            }}
          >
            Analyze thousands of funds, build personalized portfolios, and track your wealth — all powered by real-time AI intelligence.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
            <Link
              to="/register"
              style={{
                padding: "14px 28px", fontSize: 15, fontWeight: 600, color: "#fff",
                textDecoration: "none", borderRadius: 12,
                background: "linear-gradient(135deg, #0f4c81, #1a6fd4)",
                boxShadow: "0 6px 20px rgba(26,111,212,0.35)",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              Start Investing Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              to="/login"
              style={{
                padding: "14px 28px", fontSize: 15, fontWeight: 500, color: "#0f172a",
                textDecoration: "none", borderRadius: 12,
                background: "#fff", border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              See Demo
            </Link>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex", gap: 32, marginTop: 48,
              paddingTop: 32, borderTop: "1px solid #e8edf3",
              flexWrap: "wrap",
            }}
          >
            {[["₹2,400 Cr+", "AUM Tracked"], ["15,000+", "Active Investors"], ["98.4%", "Accuracy Rate"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{val}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right UI mockup */}
        <div style={{ flex: "1 1 320px", position: "relative", zIndex: 1 }}>
          <FloatingUI />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "64px 6%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#1a6fd4", letterSpacing: "0.1em", textTransform: "uppercase" }}>Why choose us</p>
          <h2 style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", fontFamily: "'DM Serif Display', serif" }}>
            Everything you need to grow wealth
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-5 0v-15A2.5 2.5 0 019.5 2z" stroke="#1a6fd4" strokeWidth="2" />
                <path d="M14.5 8A2.5 2.5 0 0117 10.5v9a2.5 2.5 0 01-5 0v-9A2.5 2.5 0 0114.5 8z" stroke="#0da870" strokeWidth="2" />
                <path d="M4.5 14A2.5 2.5 0 017 16.5v3a2.5 2.5 0 01-5 0v-3A2.5 2.5 0 014.5 14z" stroke="#f59e0b" strokeWidth="2" />
              </svg>
            }
            title="AI Fund Screener"
            desc="Screen 5,000+ funds in seconds using AI-powered filters based on risk, returns, sector, and your goals."
          />
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#1a6fd4" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="#0da870" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            title="Real-time Tracking"
            desc="Live NAV updates, portfolio P&L, and alerts — all in one clean dashboard that works across devices."
          />
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#1a6fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="#0da870" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Smart Rebalancing"
            desc="AI detects drift in your allocation and recommends precise rebalancing actions to keep you on track."
          />
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#1a6fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="#0da870" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="SEBI-Compliant Security"
            desc="Bank-grade 256-bit encryption, 2FA, and zero storage of sensitive credentials. Your money stays yours."
          />
        </div>
      </section>

      {/* CTA strip */}
      <section style={{ padding: "0 6% 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0f4c81 0%, #1a6fd4 60%, #0da870 100%)",
            borderRadius: 24, padding: "52px 48px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 24, position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: 40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, color: "#fff", fontFamily: "'DM Serif Display', serif" }}>
              Start your wealth journey today
            </h3>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: "rgba(255,255,255,0.75)" }}>
              Join 15,000+ investors. No minimum investment. Cancel anytime.
            </p>
          </div>
          <Link
            to="/register"
            style={{
              padding: "14px 30px", fontSize: 15, fontWeight: 600, color: "#1a6fd4",
              textDecoration: "none", borderRadius: 12,
              background: "#fff", position: "relative", zIndex: 1,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}
          >
            Create Free Account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="#1a6fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e8edf3", padding: "28px 6%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, #0f4c81, #1a6fd4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M3 3v18h18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M7 16l4-5 4 3 5-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Mutual-Fund Sahi Hai</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          © 2025 Mutual-Fund Sahi Hai · SEBI Registered · AMFI Compliant
        </p>
      </footer>
    </div>
  );
}