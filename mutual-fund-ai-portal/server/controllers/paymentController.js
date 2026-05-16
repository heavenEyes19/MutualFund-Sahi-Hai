import crypto from "crypto";
import bcrypt from "bcryptjs";
import Transaction from "../models/Transaction.js";
import Holding from "../models/Holding.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import OTP from "../models/OTP.js";
import sendEmail from "../utils/sendEmail.js";

const parsePositiveNav = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Initiate Wallet Buy
export const initiateBuy = async (req, res) => {
  try {
    const { schemeCode, schemeName, amount, nav, items } = req.body;
    const itemsToProcess = items || [{ schemeCode, schemeName, amount, nav }];
    
    if (itemsToProcess.length === 0 || !itemsToProcess.every(item => parsePositiveNav(item.nav))) {
      return res.status(400).json({ message: "Invalid NAV data." });
    }

    const totalAmount = itemsToProcess.reduce((sum, item) => sum + Number(item.amount), 0);
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.walletBalance < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Delete any existing OTPs for this action
    await OTP.deleteMany({ email: user.email, action: "FUND_PURCHASE" });

    // Save OTP
    await OTP.create({
      email: user.email,
      otpHash,
      action: "FUND_PURCHASE",
      metadata: { items: itemsToProcess, totalAmount },
    });

    // Send email
    let fundNames = itemsToProcess.map(i => i.schemeName).join(", ");
    await sendEmail({
      email: user.email,
      subject: "OTP for Mutual Fund Purchase",
      message: `Your OTP for purchasing ${fundNames} worth ₹${totalAmount} is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to initiate purchase" });
  }
};

// Verify Wallet Buy
export const verifyBuy = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const otpRecord = await OTP.findOne({ email: user.email, action: "FUND_PURCHASE" }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    const { items: itemsToProcess, totalAmount } = otpRecord.metadata;

    if (user.walletBalance < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    // Deduct wallet balance
    user.walletBalance -= totalAmount;
    await user.save();

    for (const item of itemsToProcess) {
      const validNav = parsePositiveNav(item.nav);
      if (!validNav) continue;

      const units = parseFloat((item.amount / validNav).toFixed(4));
      
      const newTransaction = new Transaction({
        user: userId,
        schemeCode: item.schemeCode,
        schemeName: item.schemeName,
        type: "BUY",
        amount: item.amount,
        nav: validNav,
        units,
      });
      await newTransaction.save();

      // Wallet Transaction
      const walletTx = new WalletTransaction({
        user: userId,
        type: "FUND_PURCHASE",
        amount: item.amount,
        status: "COMPLETED",
        description: item.schemeName,
      });
      await walletTx.save();

      // Update or create holding
      let holding = await Holding.findOne({ user: userId, schemeCode: item.schemeCode });
      if (holding) {
        holding.investedAmount += item.amount;
        holding.units += units;
        holding.avgNav = holding.investedAmount / holding.units;
        await holding.save();
      } else {
        holding = new Holding({
          user: userId,
          schemeCode: item.schemeCode,
          schemeName: item.schemeName,
          units,
          avgNav: validNav,
          investedAmount: item.amount,
        });
        await holding.save();
      }
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Purchase successful", balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to verify purchase" });
  }
};
