import express from "express";
const router = express.Router();

const MFAPI = "https://api.mfapi.in/mf";

// ─── Detect "X vs Y" and extract terms directly (no Groq needed) ─────────
function extractCompareTerms(query) {
  const match = query.match(/(?:compare\s+)?(.+?)\s+vs\.?\s+(.+)/i);
  return match ? [match[1].trim(), match[2].trim()] : null;
}

// ─── Step 1: Ask Groq for short searchable fund keywords ─────────────────
async function getFundNamesFromAI(userMsg) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a mutual fund search keyword generator for the Indian market.
Given a user query, return a JSON array of 2-3 short fund search keywords to look up on a fund database.
RULES:
- Return ONLY a raw JSON array of strings. No explanation, no markdown, no backticks.
- Use SHORT keywords only — fund house name + 1-2 words max (e.g. "HDFC Top 100", "SBI Bluechip", "Mirae Large Cap")
- Do NOT return full official fund names — they won't match search results
- If query mentions a non-existent entity (e.g. "Kodak fund"), return []
Example: ["HDFC Top 100", "SBI Bluechip", "Mirae Large Cap"]`,
        },
        { role: "user", content: userMsg },
      ],
    }),
  });

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content?.trim() || "[]";

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

// ─── Step 2: Search MFAPI, rank by Direct+Growth preference ──────────────
async function resolveSchemeCodes(fundName) {
  try {
    const res = await fetch(`${MFAPI}/search?q=${encodeURIComponent(fundName)}`);
    const schemes = await res.json();
    if (!Array.isArray(schemes) || !schemes.length) return [];

    return schemes
      .slice(0, 10)
      .sort((a, b) => {
        const score = (s) =>
          (/direct/i.test(s.schemeName) ? 2 : 0) +
          (/growth/i.test(s.schemeName) ? 1 : 0);
        return score(b) - score(a);
      })
      .slice(0, 5)
      .map((s) => s.schemeCode);
  } catch {
    return [];
  }
}

// ─── Step 3: Fetch NAV data for a scheme code ─────────────────────────────
async function fetchFundData(schemeCode) {
  try {
    const res = await fetch(`${MFAPI}/${schemeCode}`);
    if (!res.ok) return null;

    const { meta, data } = await res.json();
    if (!data?.length || !meta?.scheme_name) return null;

    const navValues = data.map((d) => Number(d.nav)).filter((n) => n > 0);
    if (navValues.length < 2) return null;

    // ✅ FIXED: percentage change instead of raw difference
    const latest = navValues[0];
    const past =
      navValues.length >= 90
        ? navValues[89]
        : navValues[navValues.length - 1];

    const change90 = ((latest - past) / past) * 100;

    return {
      name: meta.scheme_name,
      nav: latest,
      date: data[0].date,
      change90,
      minNAV: Math.min(...navValues),
      maxNAV: Math.max(...navValues),
    };
  } catch {
    return null;
  }
}

// All candidate codes fetched in parallel — first valid result wins
async function resolveFundData(fundName) {
  const codes = await resolveSchemeCodes(fundName);
  if (!codes.length) return null;

  const results = await Promise.all(codes.map(fetchFundData));
  return results.find(Boolean) || null;
}

// ─── Step 4: Groq summarizes verified data ───────────────────────────────
async function getSummary(userMsg, fundsData) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Write all summary that:
- Compares the funds clearly
- Mentions which fund is better for what (growth, stability, etc.)
- Uses qualitative reasoning (e.g. "higher growth", "more stable")
- DO NOT invent any numbers
- DO NOT repeat the same sentence structure

Make it sound useful and insightful, not generic.`,
          },
          {
            role: "user",
            content: `Question: "${userMsg}"\nFunds: ${fundsData
              .map((f) => f.name)
              .join(", ")}`,
          },
        ],
      }),
    });

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || "";

    return /\d{2,}/.test(text)
      ? "Here are the most relevant funds for your query."
      : text;
  } catch {
    return "Here are the most relevant funds for your query.";
  }
}

// ─── Main route ───────────────────────────────────────────────────────────
router.post("/chatbot", async (req, res) => {
  try {
    const userMsg = req.body.message?.trim();
    if (!userMsg)
      return res.status(400).json({ reply: "Empty message." });

    const fundNames =
      extractCompareTerms(userMsg) ||
      (await getFundNamesFromAI(userMsg));

    if (!fundNames.length) {
      return res.json({
        reply:
          "I couldn't find any relevant mutual funds for that query. Try asking about specific funds or categories like 'HDFC' or 'best long term funds'.",
        funds: [],
      });
    }

    const fundsData = (
      await Promise.all(fundNames.map(resolveFundData))
    ).filter(Boolean);

    if (!fundsData.length) {
      return res.json({
        reply:
          "Couldn't retrieve live fund data right now. Please try again in a moment.",
        funds: [],
      });
    }

    const reply = await getSummary(userMsg, fundsData);

    res.json({ reply, funds: fundsData });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ reply: "Something went wrong. Please try again." });
  }
});

export default router;