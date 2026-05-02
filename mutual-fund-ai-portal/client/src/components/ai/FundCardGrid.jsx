import { ArrowLeftRight } from "lucide-react";
import FundCard from "./FundCard";

// 🔹 Highlight logic (can move to utils later)
const getHighlights = (funds) => {
  const highlights = {};

  if (funds.length < 2) return highlights;

  // 🟢 Best Return
  const withChange = funds.filter((f) => f.change !== null);
  if (withChange.length) {
    const best = withChange.reduce((a, b) =>
      a.change > b.change ? a : b
    );
    highlights[best.name] = "return";
  }

  // 🟡 Lowest Risk (for now static)
  const safest = funds[0];
  if (!highlights[safest.name]) {
    highlights[safest.name] = "risk";
  }

  // 🔵 Remaining = Most Stable
  const remaining = funds.find((f) => !highlights[f.name]);
  if (remaining) {
    highlights[remaining.name] = "stable";
  }

  return highlights;
};

const FundCardGrid = ({ funds, isComparison }) => {
  const highlights = isComparison ? getHighlights(funds) : {};

  return (
    <div className={`grid gap-3 mt-2 ${
      isComparison ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
    }`}>

      {/* 🔁 Comparison label */}
      {isComparison && (
        <div className="col-span-full flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">
          <ArrowLeftRight size={13} />
          Side-by-side comparison
        </div>
      )}

      {/* 🧾 Cards */}
      {funds.map((fund, i) => (
        <FundCard
          key={i}
          fund={fund}
          highlight={highlights[fund.name] || null}
        />
      ))}
    </div>
  );
};

export default FundCardGrid;