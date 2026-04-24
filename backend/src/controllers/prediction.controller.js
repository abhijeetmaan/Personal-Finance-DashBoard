import { predictionService } from "../services/prediction.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNextMonthExpensePrediction = asyncHandler(async (req, res) => {
  const data = await predictionService.predictNextMonthExpenses();

  res.status(200).json({
    success: true,
    data,
  });
});

export const getCategoryPredictions = asyncHandler(async (req, res) => {
  const data = await predictionService.predictCategorySpending();

  res.status(200).json({
    success: true,
    data,
  });
});
