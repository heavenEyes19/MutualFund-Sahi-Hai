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
Return a JSON array of 2-3 short fund search keywords.

RULES:
- ONLY return JSON array of strings
- No explanation, no markdown
- Keep keywords short (e.g. "HDFC Top 100", "SBI Bluechip")
- If nothing relevant, return []`,
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

// ─── Step 2: Search MFAPI ────────────────────────────────────────────────
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

// ─── Step 3: Fetch NAV data ──────────────────────────────────────────────
async function fetchFundData(schemeCode) {
  try {
    const res = await fetch(`${MFAPI}/${schemeCode}`);
    if (!res.ok) return null;

    const { meta, data } = await res.json();
    if (!data?.length || !meta?.scheme_name) return null;

    const navValues = data.map((d) => Number(d.nav)).filter((n) => n > 0);
    if (navValues.length < 2) return null;

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

// ─── Resolve fund data ───────────────────────────────────────────────────
async function resolveFundData(fundName) {
  const codes = await resolveSchemeCodes(fundName);
  if (!codes.length) return null;

  const results = await Promise.all(codes.map(fetchFundData));
  return results.find(Boolean) || null;
}

// ─── Step 4: Groq summary (ALWAYS runs) ──────────────────────────────────
async function getSummary(userMsg, fundsData) {
  try {
    const hasFunds = fundsData && fundsData.length > 0;

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
            content: hasFunds
              ? `You are a mutual fund advisor.
            Answer only if the user is talking about mutual funds.
            Use ONLY the provided fund names to answer.
            Do not invent numbers.
          

            Format:
            Summary
            Insights: key differences
            Recommendation: who should choose what`
              : `You are a mutual fund advisor.

            No fund data is available.
            Answer using general investment knowledge.
            

            Format:
            Summary
            Guidance: what to consider`,
          },
          {
            role: "user",
            content: hasFunds
              ? `Question: "${userMsg}"
Funds: ${fundsData.map((f) => f.name).join(", ")}`
              : userMsg,
          },
        ],
      }),
    });

    const json = await res.json();
const raw = json.choices?.[0]?.message?.content?.trim() || "Unable to generate response.";
return raw.replace(/\*+/g, "").replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    return "Something went wrong. Try again.";
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

    const fundsData = fundNames?.length
      ? (await Promise.all(fundNames.map(resolveFundData))).filter(Boolean)
      : [];

    // ✅ ALWAYS generate reply (with or without data)
    const reply = await getSummary(userMsg, fundsData);

    res.json({
      reply,
      funds: fundsData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Something went wrong. Please try again.",
    });
  }
});

export default router;