import { TrendingUp, TrendingDown, Minus, Star, Shield, BarChart2 } from "lucide-react";

const ChangeIndicator = ({ change }) => {
  if (change === null || change === undefined) return null;

  const positive = change >= 0;
  const Icon = change === 0 ? Minus : positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold ${
        positive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
      }`}
    >
      <Icon size={12} />
      {Math.abs(change).toFixed(2)}% (90d)
    </span>
  );
};

const RiskBadge = ({ level }) => {
  const config = {
    Low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    High: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  };

  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
        config[level] || config.Medium
      }`}
    >
      {level} Risk
    </span>
  );
};

const FundCard = ({ fund, highlight }) => {
  const highlightConfig = {
    return: {
      label: "Best Return",
      icon: Star,
      color: "text-amber-500 dark:text-amber-400",
      border: "border-amber-500/40",
    },
    risk: {
      label: "Lowest Risk",
      icon: Shield,
      color: "text-emerald-500 dark:text-emerald-400",
      border: "border-emerald-500/40",
    },
    stable: {
      label: "Most Stable",
      icon: BarChart2,
      color: "text-blue-500 dark:text-blue-400",
      border: "border-blue-500/40",
    },
  };

  const h = highlight ? highlightConfig[highlight] : null;

  return (
    <div
      className={`relative flex flex-col gap-3 p-4 rounded-xl 
        bg-white dark:bg-gray-800/60 
        border border-gray-200 dark:border-gray-700/50 
        backdrop-blur-sm transition-all duration-200 
        hover:bg-gray-50 dark:hover:bg-gray-800/80 
        hover:scale-[1.02] ${h ? h.border : ""}`}
    >

      {/* 🔥 Highlight Badge */}
      {h && (
        <div
          className={`absolute -top-2.5 left-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full 
            bg-white dark:bg-gray-900 
            border ${h.border} ${h.color}`}
        >
          <h.icon size={10} />
          {h.label}
        </div>
      )}

      {/* 📌 Fund Name */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {fund.name}
        </p>

        {fund.description && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {fund.description}
          </p>
        )}
      </div>

      {/* 📊 Data */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {fund.nav && (
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              NAV
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {fund.nav}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <ChangeIndicator change={fund.change} />
          <RiskBadge level={fund.risk} />
        </div>
      </div>
    </div>
  );
};

export default FundCard;