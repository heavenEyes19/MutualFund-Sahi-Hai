import express from "express";
const router = express.Router();

router.post("/chatbot", async (req, res) => {
  try {
    const userMsg = req.body.message;

    // 🔹 STEP 1: Extract fund names (can be multiple)
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
                "Extract ALL mutual fund company names from the message. Return comma-separated names like 'hdfc, sbi'. If none, return NONE.",
            },
            {
              role: "user",
              content: userMsg,
            },
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

    // 🔹 STEP 2: If no fund mentioned → normal AI reply
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
                  "You are a helpful mutual fund advisor. Answer general questions conversationally.",
              },
              {
                role: "user",
                content: userMsg,
              },
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

    // 🔹 STEP 3: Fetch MFAPI data for all funds
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
        const { meta, data } = mfData;

        // basic
        const fundName = meta?.scheme_name;

        // latest
        const latest = data?.[0];
        const latestNAV = latest?.nav;
        const date = latest?.date;

        // history (last 7 entries)
        const navHistory = data
        ?.slice(0, 7)
        .map(d => `${d.date}: ₹${d.nav}`)
        .join("\n");
    }

    if (fundsData.length === 0) {
      return res.json({
        reply: "Could not find those funds. Try again.",
      });
    }

    // 🔹 STEP 4: Format data for AI
    const fundInfoText = fundsData
      .map(
        (f) =>
          `Fund: ${f.name}, NAV: ₹${f.nav}, Date: ${f.date}`
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
                "You are a mutual fund advisor. Use the given real data. If multiple funds, compare them clearly.",
            },
            {
              role: "user",
              content: `
                User question: ${req.body.message}

                Fund Name: ${fundName}

                Latest NAV: ₹${latestNAV}
                Date: ${date}

                90-day Change: ₹${change90.toFixed(2)}
                Range: ₹${minNAV.toFixed(2)} - ₹${maxNAV.toFixed(2)}

                Recent NAV History:
                ${navHistory}

                IMPORTANT:
                - Use ONLY this data
                - Do NOT assume missing values
                - If data is insufficient, say so
                You are a mutual fund advisor.

                Rules:
                - Keep answers SHORT (2–3 lines max)
                - Be direct and practical
                - No long explanations
                - No unnecessary disclaimers
                - If comparing, use bullet points


                Answer clearly like a financial advisor.
                `,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong" });
  }
});

export default router;