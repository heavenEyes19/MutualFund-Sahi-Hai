import Razorpay from "razorpay";
import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import Holding from "../models/Holding.js";

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay keys not configured" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      schemeCode,
      schemeName,
      amount,
      nav,
    } = req.body;

    const user = req.user.id; // from auth middleware

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }

    // Add transaction
    const units = parseFloat((amount / nav).toFixed(4));
    
    const newTransaction = new Transaction({
      user,
      schemeCode,
      schemeName,
      type: "BUY",
      amount,
      nav,
      units,
    });
    await newTransaction.save();

    // Update or create holding
    let holding = await Holding.findOne({ user, schemeCode });
    if (holding) {
      holding.investedAmount += amount;
      holding.units += units;
      holding.avgNav = holding.investedAmount / holding.units;
      await holding.save();
    } else {
      holding = new Holding({
        user,
        schemeCode,
        schemeName,
        units,
        avgNav: nav,
        investedAmount: amount,
      });
      await holding.save();
    }

    res.json({ message: "Payment verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to verify payment" });
  }
};
