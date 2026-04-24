import { Router } from "express";
import alertsRoutes from "./alerts.routes.js";
import accountsRoutes from "./accounts.routes.js";
import cardsRoutes from "./cards.routes.js";
import categoriesRoutes from "./categories.routes.js";
import financeRoutes from "./finance.routes.js";
import budgetRoutes from "./budget.routes.js";
import insightsRoutes from "./insights.routes.js";
import predictionRoutes from "./prediction.routes.js";
import transactionRoutes from "./transaction.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import reportsRoutes from "./reports.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "API running" });
});

router.use("/transactions", transactionRoutes);
router.use("/accounts", accountsRoutes);
router.use("/cards", cardsRoutes);
router.use("/finance", financeRoutes);
router.use("/categories", categoriesRoutes);
router.use("/alerts", alertsRoutes);
router.use("/budget", budgetRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/reports", reportsRoutes);
router.use("/insights", insightsRoutes);
router.use("/prediction", predictionRoutes);
router.use("/predictions", predictionRoutes);

export default router;
