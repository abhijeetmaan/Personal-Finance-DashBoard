import { Router } from "express";
import {
  getCashflow,
  getProfitAndLoss,
} from "../controllers/reports.controller.js";

const router = Router();

router.get("/pnl", getProfitAndLoss);
router.get("/cashflow", getCashflow);

export default router;
