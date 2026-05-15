import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import KYC from "../models/KYC.js";

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const kyc = await KYC.findOne({ userId: req.user._id });

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
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      kycStatus,
      kycRejectionReason,
      isKycVerified: kycStatus === "VERIFIED",
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ msg: "Server error fetching profile" });
  }
});

export default router;