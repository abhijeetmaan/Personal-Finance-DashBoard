import { Router } from "express";
import {
  getExpenseInsights,
  getSpendingComparison,
} from "../controllers/insights.controller.js";

const router = Router();

router.get("/expenses", getExpenseInsights);
router.get("/comparison", getSpendingComparison);

export default router;
