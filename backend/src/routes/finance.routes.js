import { Router } from "express";
import { getFinanceSummary } from "../controllers/finance.controller.js";

const router = Router();

router.get("/summary", getFinanceSummary);

export default router;
