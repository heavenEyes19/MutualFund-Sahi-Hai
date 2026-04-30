import express from "express";
const router = express.Router();

router.post("/chatbot", async (req, res) => {
  try {
    const userMsg = req.body.message;

    // 🔹 STEP 1: Extract fund names
    const extractRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
              content:
                "Extract ALL mutual fund company names. Return comma-separated like 'hdfc, sbi'. If none, return NONE.",
            },
            { role: "user", content: userMsg },
          ],
        }),
      }
    );

    const extractData = await extractRes.json();
    const raw =
      extractData.choices?.[0]?.message?.content?.toLowerCase() || "";

    const fundKeywords =
      raw === "none"
        ? []
        : raw.split(",").map((s) => s.trim()).filter(Boolean);

    // 🔹 STEP 2: No fund → normal reply
    if (fundKeywords.length === 0) {
      const normalRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
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
                content:
                  "You are a helpful mutual fund advisor. Keep answers short.",
              },
              { role: "user", content: userMsg },
            ],
          }),
        }
      );

      const normalData = await normalRes.json();
      return res.json({
        reply:
          normalData.choices?.[0]?.message?.content || "No response",
      });
    }

    // 🔹 STEP 3: Fetch MF data
    const fundsData = [];

    for (const keyword of fundKeywords) {
      const searchRes = await fetch(
        `http://localhost:5000/api/mutual-funds/search?q=${keyword}`
      );
      const searchData = await searchRes.json();

      const code = searchData.schemes?.[0]?.schemeCode;
      if (!code) continue;

      const mfRes = await fetch(
        `http://localhost:5000/api/mutual-funds/${code}`
      );

      const mfData = await mfRes.json(); // ✅ FIXED
      const { meta, data } = mfData;

      if (!data || !data.length) continue;

      const fundName = meta?.scheme_name;

      const latest = data[0];
      const latestNAV = Number(latest?.nav);
      const date = latest?.date;

      // 🔹 Calculations
      const navValues = data.map((d) => Number(d.nav)).filter(Boolean);

      const maxNAV = Math.max(...navValues);
      const minNAV = Math.min(...navValues);

      const change90 =
        navValues.length >= 90
          ? navValues[0] - navValues[89]
          : navValues[0] - navValues[navValues.length - 1];

      const navHistory = data
        .slice(0, 7)
        .map((d) => `${d.date}: ₹${d.nav}`)
        .join("\n");

      // ✅ FIXED: push data
      fundsData.push({
        name: fundName,
        nav: latestNAV,
        date,
        change90,
        minNAV,
        maxNAV,
        history: navHistory,
      });
    }

    if (fundsData.length === 0) {
      return res.json({
        reply: "Could not find those funds. Try again.",
      });
    }

    // 🔹 STEP 4: Format data
    const fundInfoText = fundsData
      .map(
        (f) => `
Fund: ${f.name}
NAV: ₹${f.nav}
Date: ${f.date}
90-day Change: ₹${f.change90.toFixed(2)}
Range: ₹${f.minNAV.toFixed(2)} - ₹${f.maxNAV.toFixed(2)}
Recent NAV:
${f.history}
`
      )
      .join("\n");

    // 🔹 STEP 5: Final AI response
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
              content:
                "You are a mutual fund advisor. Keep answers short (2-3 lines). Compare if multiple funds.",
            },
            {
              role: "user",
              content: `
User question: ${userMsg}

${fundInfoText}

Answer clearly and briefly.
`,
            },
          ],
        }),
      }
    );

    const aiData = await response.json();

    res.json({
      reply: aiData.choices?.[0]?.message?.content || "No response",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong" });
  }
});

export default router;