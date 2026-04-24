import { Router } from "express";
import {
  getBudget,
  getBudgetAlerts,
  getBudgetSuggestions,
  setBudget,
} from "../controllers/budget.controller.js";

const router = Router();

router.get("/suggestions", getBudgetSuggestions);
router.get("/alerts", getBudgetAlerts);
router.route("/").get(getBudget).post(setBudget);

export default router;
