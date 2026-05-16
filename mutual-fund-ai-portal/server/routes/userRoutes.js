import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import KYC from "../models/KYC.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const kyc = await KYC.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id).select("-password -otp");

    let kycStatus = "NOT_SUBMITTED";
    let kycRejectionReason = null;

    if (kyc) {
      if (kyc.status === "Pending") kycStatus = "PENDING_VERIFICATION";
      else if (kyc.status === "Approved") kycStatus = "VERIFIED";
      else if (kyc.status === "Rejected") {
        kycStatus = "REJECTED";
        kycRejectionReason = kyc.rejectionReason;
      }
    }

    res.json({
      ...user.toObject(),
      kycStatus,
      kycRejectionReason,
      isKycVerified: kycStatus === "VERIFIED",
      isMpinSet: !!user.mpin,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ msg: "Server error fetching profile" });
  }
});

// Update Profile Details
router.post("/update-profile", protect, async (req, res) => {
  const { name, phoneNumber } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    await user.save();
    res.json({ msg: "Profile updated successfully", user: { name: user.name, phoneNumber: user.phoneNumber } });
  } catch (err) {
    res.status(500).json({ msg: "Error updating profile" });
  }
});

// Set MPIN (Generation)
router.post("/set-mpin", protect, async (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length < 4) return res.status(400).json({ msg: "Invalid MPIN" });
  
  try {
    const user = await User.findById(req.user._id);
    const salt = await bcrypt.genSalt(10);
    user.mpin = await bcrypt.hash(mpin, salt);
    await user.save();
    res.json({ msg: "MPIN set successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error setting MPIN" });
  }
});

// Change MPIN
router.post("/change-mpin", protect, async (req, res) => {
  const { oldMpin, newMpin } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user.mpin) return res.status(400).json({ msg: "MPIN not set" });
    
    const isMatch = await bcrypt.compare(oldMpin, user.mpin);
    if (!isMatch) return res.status(400).json({ msg: "Invalid old MPIN" });

    const salt = await bcrypt.genSalt(10);
    user.mpin = await bcrypt.hash(newMpin, salt);
    await user.save();
    res.json({ msg: "MPIN changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error changing MPIN" });
  }
});

// Add Bank Account
router.post("/bank-accounts", protect, async (req, res) => {
  const { accountNumber, ifsc, bankName, accountHolderName } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.bankAccounts.push({ accountNumber, ifsc, bankName, accountHolderName });
    await user.save();
    res.json({ msg: "Bank account added successfully", bankAccounts: user.bankAccounts });
  } catch (err) {
    res.status(500).json({ msg: "Error adding bank account" });
  }
});

// Add Nominee
router.post("/nominees", protect, async (req, res) => {
  const { name, relationship, allocation } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.nominees.push({ name, relationship, allocation });
    await user.save();
    res.json({ msg: "Nominee added successfully", nominees: user.nominees });
  } catch (err) {
    res.status(500).json({ msg: "Error adding nominee" });
  }
});

export default router;