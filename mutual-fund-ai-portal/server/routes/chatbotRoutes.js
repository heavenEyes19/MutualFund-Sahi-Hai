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
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a mutual fund search keyword generator for the Indian market.
Output a JSON object with a "keywords" array containing 2-3 short fund search keywords.

RULES:
- ONLY return a JSON object
- No explanation
- Keep keywords short (e.g. "HDFC Top 100", "SBI Bluechip")
- Interpret generic terms (like "long term" or "low risk") into actual specific fund names.
- If nothing relevant, return {"keywords": []}`,
        },
        { role: "user", content: userMsg },
      ],
    }),
  });

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content?.trim() || '{"keywords": []}';

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 3) : [];
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
              ? `You are a helpful mutual fund advisor for the Indian market.
The user has asked a question and the following real fund data has been fetched for context.
Use ONLY the provided fund names and data to answer. Do not invent numbers.

Format your answer as:
Summary: (brief overview)
Insights: (key differences between the funds)
Recommendation: (who should invest in which fund and why)`
              : `You are a helpful mutual fund advisor for the Indian market.
Answer the user's question using general investment knowledge.
Be direct and informative.

Format your answer as:
Summary: (brief overview)
Guidance: (what the user should consider)`,
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

    // Only resolve fund data if the AI actually identified relevant fund keywords
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