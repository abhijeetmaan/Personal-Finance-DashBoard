import { Router } from "express";
import {
  getCategoryPredictions,
  getNextMonthExpensePrediction,
} from "../controllers/prediction.controller.js";

const router = Router();

router.get("/next-month", getNextMonthExpensePrediction);
router.get("/categories", getCategoryPredictions);

export default router;
