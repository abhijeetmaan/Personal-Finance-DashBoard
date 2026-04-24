import { insightsService } from "../services/insights.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getExpenseInsights = asyncHandler(async (req, res) => {
  const data = await insightsService.getExpenseInsights(req.query);

  res.status(200).json({
    success: true,
    data,
  });
});

export const getSpendingComparison = asyncHandler(async (req, res) => {
  const data = await insightsService.getSpendingComparison(req.query);

  res.status(200).json({
    success: true,
    data,
  });
});
