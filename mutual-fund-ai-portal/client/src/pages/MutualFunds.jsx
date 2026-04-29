import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getMutualFundDetails,
  listMutualFunds,
  searchMutualFunds,
} from "../services/mutualFunds";


const theme = {
  navy: "#0f4c81",
  blue: "#1a6fd4",
  emerald: "#0da870",
  amber: "#f59e0b",
  coral: "#e05c3a",
  slate: "#0f172a",
  muted: "#64748b",
  softText: "#94a3b8",
  surface: "#ffffff",
  background: "#f7f9fc",
  line: "#dfe8f3",
};

const panelStyle = {
  background: theme.surface,
  borderRadius: 20,
  border: `1px solid ${theme.line}`,
  boxShadow: "0 18px 50px rgba(15,76,129,0.08)",
};

const popularSearches = ["SBI", "HDFC", "ICICI", "Axis", "Nippon"];

const isCancelledRequest = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

const parseNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseNavDate = (value) => {
  if (!value) {
    return null;
  }

  const [day, month, year] = value.split("-").map(Number);

  if (!day || !month || !year) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatNavDate = (value) => {
  const parsedDate = parseNavDate(value);

  if (!parsedDate) {
    return value || "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatNavValue = (value) => {
  const parsedValue = parseNumber(value);

  if (parsedValue === null) {
    return "--";
  }

  return `Rs. ${parsedValue.toFixed(4)}`;
};

const formatSignedNavValue = (value) => {
  if (value === null || value === undefined) {
    return "--";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}Rs. ${Math.abs(value).toFixed(4)}`;
};

const formatSignedPercent = (value) => {
  if (value === null || value === undefined) {
    return "--";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
};

const getTone = (value) => {
  if (value === null || value === undefined) {
    return {
      background: "#f8fafc",
      text: theme.slate,
      border: theme.line,
    };
  }

  return value >= 0
    ? {
        background: "#e8fbf2",
        text: theme.emerald,
        border: "#bfe8d0",
      }
    : {
        background: "#fff0eb",
        text: theme.coral,
        border: "#ffd2c5",
      };
};

const getSchemeBadges = (schemeName = "") => {
  const normalizedName = schemeName.toLowerCase();
  const badges = [];

  if (normalizedName.includes("direct")) {
    badges.push("Direct");
  }

  if (normalizedName.includes("regular")) {
    badges.push("Regular");
  }

  if (normalizedName.includes("growth")) {
    badges.push("Growth");
  }

  if (normalizedName.includes("idcw") || normalizedName.includes("dividend")) {
    badges.push("Income");
  }

  return badges.slice(0, 3);
};

const buildSparklinePoints = (history = []) => {
  const values = history
    .slice()
    .reverse()
    .map((entry) => parseNumber(entry?.nav))
    .filter((value) => value !== null);

  if (!values.length) {
    return "";
  }

  if (values.length === 1) {
    return "0,22 180,22";
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 180;
      const y =
        maxValue === minValue
          ? 22
          : 44 - ((value - minValue) / (maxValue - minValue)) * 36;

      return `${x},${y}`;
    })
    .join(" ");
};

const getFundSummary = (fund) => {
  const history = Array.isArray(fund?.data) ? fund.data : [];
  const latestEntry = fund?.latest || history[0] || null;
  const latestValue = parseNumber(latestEntry?.nav);
  const previousValue = history[1] ? parseNumber(history[1].nav) : null;
  const oldestEntry = history.length ? history[history.length - 1] : null;
  const oldestValue = parseNumber(oldestEntry?.nav);
  const dayChange = latestValue !== null && previousValue !== null ? latestValue - previousValue : null;
  const rangeChange = latestValue !== null && oldestValue !== null ? latestValue - oldestValue : null;
  const rangeChangePercent =
    rangeChange !== null && oldestValue ? (rangeChange / oldestValue) * 100 : null;

  const navValues = history
    .map((entry) => parseNumber(entry?.nav))
    .filter((value) => value !== null);

  return {
    history,
    historyPreview: history.slice(0, 8),
    latestEntry,
    latestValue,
    dayChange,
    rangeChange,
    rangeChangePercent,
    high: navValues.length ? Math.max(...navValues) : null,
    low: navValues.length ? Math.min(...navValues) : null,
    sparklinePoints: buildSparklinePoints(history.slice(0, 30)),
    oldestDate: oldestEntry?.date || null,
  };
};

function SearchChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid transparent" : `1px solid ${theme.line}`,
        background: active
          ? "linear-gradient(135deg, #0f4c81 0%, #1a6fd4 100%)"
          : "#ffffff",
        color: active ? "#ffffff" : theme.slate,
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: active ? "0 8px 20px rgba(26,111,212,0.24)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function FundListCard({ fund, selected, onSelect }) {
  const badges = getSchemeBadges(fund.schemeName);

  return (
    <button
      type="button"
      onClick={() => onSelect(fund.schemeCode)}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 18,
        border: selected ? "1px solid transparent" : `1px solid ${theme.line}`,
        padding: 18,
        background: selected
          ? "linear-gradient(135deg, rgba(15,76,129,0.98) 0%, rgba(26,111,212,0.95) 100%)"
          : "#ffffff",
        color: selected ? "#ffffff" : theme.slate,
        cursor: "pointer",
        boxShadow: selected ? "0 18px 36px rgba(15,76,129,0.22)" : "0 6px 18px rgba(15,76,129,0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {fund.schemeName}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 12,
              color: selected ? "rgba(255,255,255,0.72)" : theme.muted,
            }}
          >
            Scheme Code: {fund.schemeCode}
          </p>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            flexShrink: 0,
            background: selected
              ? "rgba(255,255,255,0.12)"
              : "linear-gradient(135deg, rgba(26,111,212,0.12), rgba(13,168,112,0.12))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 18L10 12L14 15L20 8"
              stroke={selected ? "#ffffff" : theme.blue}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 8H15"
              stroke={selected ? "#ffffff" : theme.emerald}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {badges.length ? (
          badges.map((badge) => (
            <span
              key={badge}
              style={{
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                padding: "5px 10px",
                background: selected ? "rgba(255,255,255,0.12)" : "#eef5ff",
                color: selected ? "#ffffff" : theme.blue,
              }}
            >
              {badge}
            </span>
          ))
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 999,
              padding: "5px 10px",
              background: selected ? "rgba(255,255,255,0.12)" : "#eef8f2",
              color: selected ? "#ffffff" : theme.emerald,
            }}
          >
            Mutual Fund Scheme
          </span>
        )}
      </div>
    </button>
  );
}

function MetricCard({ label, value, helper, tone }) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 18,
        borderRadius: 18,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: theme.muted }}>{label}</p>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 22,
          fontWeight: 700,
          color: tone?.text || theme.slate,
        }}
      >
        {value}
      </p>
      <div
        style={{
          display: "inline-flex",
          marginTop: 12,
          padding: "6px 10px",
          borderRadius: 999,
          background: tone?.background || "#f8fafc",
          color: tone?.text || theme.slate,
          border: `1px solid ${tone?.border || theme.line}`,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {helper}
      </div>
    </div>
  );
}

function MutualFundDetail({ fund, loading, error }) {
  if (loading) {
    return (
      <div style={{ ...panelStyle, padding: 28 }}>
        <p style={{ margin: 0, fontSize: 14, color: theme.muted }}>
          Loading mutual fund details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...panelStyle, padding: 28 }}>
        <p style={{ margin: 0, fontSize: 14, color: theme.coral }}>{error}</p>
      </div>
    );
  }

  if (!fund) {
    return (
      <div style={{ ...panelStyle, padding: 28 }}>
        <p style={{ margin: 0, fontSize: 14, color: theme.muted }}>
          Pick a scheme from the list to view its NAV history and fund metadata.
        </p>
      </div>
    );
  }

  const summary = getFundSummary(fund);
  const rangeTone = getTone(summary.rangeChange);
  const dayTone = getTone(summary.dayChange);
  const meta = fund.meta || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          ...panelStyle,
          padding: 28,
          background: "linear-gradient(135deg, #0f4c81 0%, #1a6fd4 62%, #0da870 100%)",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            left: 20,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Live NAV Snapshot
          </div>

          <h2
            style={{
              margin: "18px 0 0",
              fontSize: "clamp(26px, 4vw, 34px)",
              lineHeight: 1.25,
              fontWeight: 700,
              maxWidth: 720,
            }}
          >
            {meta.scheme_name || "Mutual Fund Details"}
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 18,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
                Latest NAV
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 34, fontWeight: 700 }}>
                {formatNavValue(summary.latestEntry?.nav)}
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 14px",
                borderRadius: 999,
                background: dayTone.background,
                color: dayTone.text,
                border: `1px solid ${dayTone.border}`,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Daily move: {formatSignedNavValue(summary.dayChange)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
                Fund House
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600 }}>
                {meta.fund_house || "--"}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
                Last Updated
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600 }}>
                {formatNavDate(summary.latestEntry?.date)}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
                Scheme Code
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600 }}>
                {meta.scheme_code || "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="90 Day NAV Change"
          value={formatSignedNavValue(summary.rangeChange)}
          helper={formatSignedPercent(summary.rangeChangePercent)}
          tone={rangeTone}
        />
        <MetricCard
          label="Range High"
          value={formatNavValue(summary.high)}
          helper={`Since ${formatNavDate(summary.oldestDate)}`}
          tone={{ background: "#eef5ff", text: theme.blue, border: "#d4e5ff" }}
        />
        <MetricCard
          label="Range Low"
          value={formatNavValue(summary.low)}
          helper={meta.scheme_category || "MFAPI historical window"}
          tone={{ background: "#fff7e7", text: theme.amber, border: "#f7dd9c" }}
        />
      </div>

      <div
        style={{
          ...panelStyle,
          padding: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.slate }}>
            NAV Trend
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: theme.muted }}>
            Recent movement across the last 30 data points in the selected history window.
          </p>

          <div
            style={{
              marginTop: 24,
              borderRadius: 18,
              background: "linear-gradient(180deg, rgba(26,111,212,0.08), rgba(13,168,112,0.04))",
              border: `1px solid ${theme.line}`,
              padding: 18,
            }}
          >
            <svg width="100%" height="80" viewBox="0 0 180 48" preserveAspectRatio="none">
              <polyline
                points={summary.sparklinePoints}
                fill="none"
                stroke={summary.rangeChange !== null && summary.rangeChange >= 0 ? theme.emerald : theme.coral}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            background: "#fbfdff",
            border: `1px solid ${theme.line}`,
            padding: 18,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.slate }}>
            Scheme Metadata
          </p>

          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {[
              ["Scheme Type", meta.scheme_type],
              ["Scheme Category", meta.scheme_category],
              ["Growth ISIN", meta.isin_growth],
              ["Dividend Reinvestment ISIN", meta.isin_div_reinvestment],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: 11, color: theme.softText, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {label}
                </p>
                <p style={{ margin: "5px 0 0", fontSize: 13, color: theme.slate, lineHeight: 1.5 }}>
                  {value || "--"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.slate }}>
              Recent NAV History
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: theme.muted }}>
              Showing the latest 8 data points returned for the selected scheme.
            </p>
          </div>
          <a
            href="https://www.mfapi.in/docs/"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              color: theme.blue,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Source: MFAPI Docs
          </a>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          {summary.historyPreview.map((entry, index) => {
            const previousEntry = summary.historyPreview[index + 1];
            const entryDelta =
              parseNumber(entry?.nav) !== null && parseNumber(previousEntry?.nav) !== null
                ? parseNumber(entry.nav) - parseNumber(previousEntry.nav)
                : null;
            const entryTone = getTone(entryDelta);

            return (
              <div
                key={`${entry.date}-${entry.nav}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 12,
                  alignItems: "center",
                  borderRadius: 16,
                  border: `1px solid ${theme.line}`,
                  padding: "14px 16px",
                  background: "#ffffff",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.slate }}>
                    {formatNavDate(entry.date)}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: theme.muted }}>
                    NAV observation
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.slate }}>
                  {formatNavValue(entry.nav)}
                </p>
                <div
                  style={{
                    justifySelf: "end",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: entryTone.background,
                    color: entryTone.text,
                    border: `1px solid ${entryTone.border}`,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {formatSignedNavValue(entryDelta)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MutualFunds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [funds, setFunds] = useState([]);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState(searchParams.get("scheme") || "");
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedFund, setSelectedFund] = useState(null);

  useEffect(() => {
    const params = {};
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      params.q = trimmedQuery;
    }

    if (selectedSchemeCode) {
      params.scheme = selectedSchemeCode;
    }

    setSearchParams(params, { replace: true });
  }, [query, selectedSchemeCode, setSearchParams]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 1) {
      setFunds([]);
      setListLoading(false);
      setListError("");
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    const loadFunds = async () => {
      setListLoading(true);
      setListError("");

      try {
        const response =
          trimmedQuery.length >= 2
            ? await searchMutualFunds({
                q: trimmedQuery,
                limit: 16,
                signal: controller.signal,
              })
            : await listMutualFunds({
                limit: 12,
                offset: 0,
                signal: controller.signal,
              });

        if (!active) {
          return;
        }

        const nextFunds = Array.isArray(response?.schemes) ? response.schemes : [];
        const hasSelectedFund = nextFunds.some(
          (fund) => String(fund.schemeCode) === String(selectedSchemeCode),
        );

        setFunds(nextFunds);
        setListLoading(false);

        if ((!selectedSchemeCode || (trimmedQuery.length >= 2 && !hasSelectedFund)) && nextFunds[0]) {
          setSelectedSchemeCode(String(nextFunds[0].schemeCode));
        }
      } catch (error) {
        if (isCancelledRequest(error) || !active) {
          return;
        }

        setFunds([]);
        setListLoading(false);
        setListError(
          error?.response?.data?.message ||
            "We could not load mutual fund schemes right now.",
        );
      }
    };

    const timeoutId = setTimeout(loadFunds, trimmedQuery ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selectedSchemeCode) {
      setSelectedFund(null);
      setDetailLoading(false);
      setDetailError("");
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    const loadFundDetails = async () => {
      setSelectedFund(null);
      setDetailLoading(true);
      setDetailError("");

      try {
        const response = await getMutualFundDetails(selectedSchemeCode, {
          signal: controller.signal,
        });

        if (!active) {
          return;
        }

        setSelectedFund(response);
        setDetailLoading(false);
      } catch (error) {
        if (isCancelledRequest(error) || !active) {
          return;
        }

        setDetailLoading(false);
        setDetailError(
          error?.response?.data?.message ||
            "We could not load this scheme's details right now.",
        );
      }
    };

    loadFundDetails();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedSchemeCode]);

  const trimmedQuery = query.trim();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        fontFamily: "'DM Sans', sans-serif",
        color: theme.slate,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />


      <section
        style={{
          padding: "56px 6% 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: "8%",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(26,111,212,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            right: "6%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13,168,112,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 999,
              background: "#eaf4ff",
              color: theme.blue,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            MFAPI Powered Discovery
          </div>

          <h1
            style={{
              margin: "18px 0 0",
              fontSize: "clamp(34px, 5vw, 56px)",
              lineHeight: 1.08,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              fontFamily: "'DM Serif Display', serif",
              maxWidth: 760,
            }}
          >
            Search, list, and inspect Indian mutual fund schemes in one focused workspace.
          </h1>

          <p
            style={{
              margin: "18px 0 0",
              fontSize: 16,
              lineHeight: 1.8,
              color: theme.muted,
              maxWidth: 720,
            }}
          >
            This page is isolated from the existing auth and user flows, but styled to fit the
            current portal so your team can plug it into the rest of the project seamlessly.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 6% 72px" }}>
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ ...panelStyle, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.slate }}>
                    Mutual Fund Search
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: theme.muted }}>
                    Search by AMC, scheme family, or specific fund name.
                  </p>
                </div>
                {trimmedQuery ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    style={{
                      border: `1px solid ${theme.line}`,
                      background: "#ffffff",
                      color: theme.slate,
                      borderRadius: 12,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Clear Search
                  </button>
                ) : null}
              </div>

              <label
                htmlFor="mutual-fund-search"
                style={{
                  display: "block",
                  marginTop: 18,
                  fontSize: 12,
                  color: theme.softText,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Search Window
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 10,
                  border: `1px solid ${theme.line}`,
                  borderRadius: 18,
                  padding: "0 16px",
                  background: "#fbfdff",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke={theme.softText} strokeWidth="2" />
                  <path d="M20 20L16.65 16.65" stroke={theme.softText} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  id="mutual-fund-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try HDFC, SBI Small Cap, ICICI Prudential..."
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    padding: "16px 0",
                    fontSize: 14,
                    color: theme.slate,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                {popularSearches.map((label) => (
                  <SearchChip
                    key={label}
                    label={label}
                    active={trimmedQuery.toLowerCase() === label.toLowerCase()}
                    onClick={() => setQuery(label)}
                  />
                ))}
              </div>
            </div>

            <div style={{ ...panelStyle, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.slate }}>
                    {trimmedQuery ? "Search Results" : "Scheme Listing"}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: theme.muted }}>
                    {trimmedQuery
                      ? "Click a result to load its detailed NAV history."
                      : "Default paginated scheme list fetched from MFAPI."}
                  </p>
                </div>
                <div
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "#eef8f2",
                    color: theme.emerald,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {funds.length} schemes
                </div>
              </div>

              <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
                {listLoading ? (
                  <p style={{ margin: 0, fontSize: 14, color: theme.muted }}>
                    Loading schemes...
                  </p>
                ) : listError ? (
                  <p style={{ margin: 0, fontSize: 14, color: theme.coral }}>{listError}</p>
                ) : trimmedQuery.length === 1 ? (
                  <p style={{ margin: 0, fontSize: 14, color: theme.muted }}>
                    Type at least 2 characters to search for a mutual fund scheme.
                  </p>
                ) : funds.length ? (
                  funds.map((fund) => (
                    <FundListCard
                      key={fund.schemeCode}
                      fund={fund}
                      selected={String(fund.schemeCode) === String(selectedSchemeCode)}
                      onSelect={(schemeCode) => setSelectedSchemeCode(String(schemeCode))}
                    />
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: theme.muted }}>
                    No schemes matched your search. Try another AMC or fund name.
                  </p>
                )}
              </div>
            </div>
          </div>

          <MutualFundDetail
            fund={selectedFund}
            loading={detailLoading}
            error={detailError}
          />
        </div>
      </section>
    </div>
  );
}
