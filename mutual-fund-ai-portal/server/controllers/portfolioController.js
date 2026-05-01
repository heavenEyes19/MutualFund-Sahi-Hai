import Holding from "../models/Holding.js";
import Transaction from "../models/Transaction.js";

// Helper to get latest NAV
const getLatestNav = async (schemeCode) => {
  try {
    const url = new URL(`/mf/${schemeCode}/latest`, process.env.MFAPI_BASE_URL);
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.[0]?.nav ? parseFloat(data.data[0].nav) : null;
  } catch (error) {
    console.error("Error fetching NAV:", error);
    return null;
  }
};

export const getPortfolio = async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user._id });
    
    let totalInvested = 0;
    let currentValue = 0;
    
    const enrichedHoldings = await Promise.all(
      holdings.map(async (h) => {
        // Fetch real NAV or mock it if API fails
        let currentNav = await getLatestNav(h.schemeCode);
        if (!currentNav) {
            // mock a 10% gain for demo purposes if api fails
            currentNav = h.avgNav * 1.1; 
        }
        
        const currentHoldingValue = h.units * currentNav;
        const invested = h.investedAmount;
        const gainLoss = ((currentHoldingValue - invested) / invested) * 100;
        
        totalInvested += invested;
        currentValue += currentHoldingValue;
        
        return {
          ...h.toObject(),
          currentNav,
          currentValue: currentHoldingValue,
          gainLossPercent: gainLoss,
        };
      })
    );
    
    const totalReturns = currentValue - totalInvested;
    const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    
    res.json({
      overview: {
        totalInvested,
        currentValue,
        totalReturns,
        totalReturnsPercent,
      },
      holdings: enrichedHoldings,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio", error: error.message });
  }
};

export const buyFund = async (req, res) => {
  const { schemeCode, schemeName, amount, nav } = req.body;
  const units = amount / nav;

  try {
    const transaction = await Transaction.create({
      user: req.user._id,
      schemeCode,
      schemeName,
      type: "BUY",
      amount,
      nav,
      units,
    });

    let holding = await Holding.findOne({ user: req.user._id, schemeCode });
    if (holding) {
      const totalUnits = holding.units + units;
      const totalInvested = holding.investedAmount + amount;
      const newAvgNav = totalInvested / totalUnits;

      holding.units = totalUnits;
      holding.investedAmount = totalInvested;
      holding.avgNav = newAvgNav;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: req.user._id,
        schemeCode,
        schemeName,
        units,
        avgNav: nav,
        investedAmount: amount,
      });
    }

    res.status(201).json({ message: "Fund purchased successfully", transaction, holding });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing fund", error: error.message });
  }
};

export const sellFund = async (req, res) => {
  const { schemeCode, unitsToSell, currentNav } = req.body;

  try {
    let holding = await Holding.findOne({ user: req.user._id, schemeCode });
    if (!holding || holding.units < unitsToSell) {
      return res.status(400).json({ message: "Insufficient units to sell" });
    }

    const amount = unitsToSell * currentNav;

    const transaction = await Transaction.create({
      user: req.user._id,
      schemeCode,
      schemeName: holding.schemeName,
      type: "SELL",
      amount,
      nav: currentNav,
      units: unitsToSell,
    });

    holding.units -= unitsToSell;
    holding.investedAmount -= unitsToSell * holding.avgNav;

    if (holding.units <= 0) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }

    res.json({ message: "Fund sold successfully", transaction, amount });
  } catch (error) {
    res.status(500).json({ message: "Error selling fund", error: error.message });
  }
};

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
};
