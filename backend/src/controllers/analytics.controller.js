import { asyncHandler } from "../utils/asyncHandler.js";
import { analyticsService } from "../services/analytics.service.js";

export const getTopCategory = asyncHandler(async (req, res) => {
  const { userId, month, year } = req.query;
  const data = await analyticsService.getTopCategory({ userId, month, year });

  res.status(200).json({
    success: true,
    data,
  });
});

export const getNetBalance = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const data = await analyticsService.getNetBalance({ userId });

  res.status(200).json({
    success: true,
    data,
  });
});

export const getNetWorth = asyncHandler(async (req, res) => {
  const { userId, months } = req.query;
  const data = await analyticsService.getNetWorth({
    userId,
    months,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

export const getNetWorthTrend = asyncHandler(async (req, res) => {
  const { userId, months } = req.query;
  const data = await analyticsService.getNetWorthTrend({
    userId,
    months,
  });

  res.status(200).json({
    success: true,
    data,
  });
});
