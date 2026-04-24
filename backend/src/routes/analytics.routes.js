import { Router } from "express";
import {
  getNetBalance,
  getNetWorth,
  getNetWorthTrend,
  getTopCategory,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/top-category", getTopCategory);
router.get("/net-balance", getNetBalance);
router.get("/net-worth", getNetWorth);
router.get("/net-worth-trend", getNetWorthTrend);

export default router;
