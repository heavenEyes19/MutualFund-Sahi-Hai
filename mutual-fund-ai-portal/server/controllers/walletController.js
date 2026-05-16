import Razorpay from "razorpay";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import OTP from "../models/OTP.js";
import sendEmail from "../utils/sendEmail.js";

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: (process.env.RAZORPAY_KEY_ID || "").trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
  });
};

// Initiate topup
export const initiateTopup = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ message: "Minimum top-up amount is ₹100" });
    }

    const instance = getRazorpayInstance();
    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_topup_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).json({ message: "Failed to create order" });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Verify topup
export const verifyTopup = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = req.user.id;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", (process.env.RAZORPAY_KEY_SECRET || "").trim())
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }

    // Idempotency check: see if we already processed this payment_id
    const existingTx = await WalletTransaction.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingTx) {
      return res.status(400).json({ message: "Payment already processed" });
    }

    // Update wallet balance
    const user = await User.findById(userId);
    user.walletBalance += amount;
    await user.save();

    // Create transaction record
    const newTx = new WalletTransaction({
      user: userId,
      type: "TOPUP",
      amount: amount,
      status: "COMPLETED",
      description: "Top-up via Payment Gateway",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    await newTx.save();

    res.json({ message: "Top-up successful", balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to verify top-up" });
  }
};

// Get wallet details
export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      balance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch wallet details" });
  }
};

// Initiate withdraw
export const initiateWithdraw = async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Delete any existing OTPs for this action
    await OTP.deleteMany({ email: user.email, action: "WITHDRAWAL" });

    // Save OTP
    await OTP.create({
      email: user.email,
      otpHash,
      action: "WITHDRAWAL",
      metadata: { amount, bankAccount },
    });

    // Send email
    await sendEmail({
      email: user.email,
      subject: "OTP for Withdrawal",
      message: `Your OTP for withdrawing ₹${amount} is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Verify withdraw
export const verifyWithdraw = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const otpRecord = await OTP.findOne({ email: user.email, action: "WITHDRAWAL" }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    const { amount, bankAccount } = otpRecord.metadata;

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance
    user.walletBalance -= amount;
    await user.save();

    // Trigger Razorpay X payout (mocked here)
    const mockPayoutId = `pout_${Math.floor(Math.random() * 1000000)}`;

    const newTx = new WalletTransaction({
      user: userId,
      type: "WITHDRAWAL",
      amount: amount,
      status: "COMPLETED",
      description: `Withdrawal to Bank Account (${bankAccount || 'Saved'})`,
      razorpayPayoutId: mockPayoutId,
    });
    await newTx.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Withdrawal processed successfully", balance: user.walletBalance });

  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to verify withdrawal" });
  }
};
