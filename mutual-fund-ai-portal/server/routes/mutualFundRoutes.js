import express from "express";
import {
  getLatestMutualFundNav,
  getMutualFundDetails,
  listMutualFunds,
  searchMutualFunds,
} from "../controllers/mutualFundController.js";

const router = express.Router();

router.get("/", listMutualFunds);
router.get("/search", searchMutualFunds);
router.get("/:schemeCode/latest", getLatestMutualFundNav);
router.get("/:schemeCode", getMutualFundDetails);

export default router;
