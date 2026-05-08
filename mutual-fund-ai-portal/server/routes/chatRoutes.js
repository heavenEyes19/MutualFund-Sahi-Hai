import express from "express";
import { getChatHistory, getChatInvestors } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/history", protect, getChatHistory);
router.get("/history/:investorId", protect, getChatHistory);
router.get("/investors", protect, getChatInvestors);

export default router;
