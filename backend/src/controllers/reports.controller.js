import { asyncHandler } from "../utils/asyncHandler.js";
import { reportsService } from "../services/reports.service.js";

export const getProfitAndLoss = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  const data = await reportsService.getProfitAndLoss({
    userId,
    startDate,
    endDate,
  });

  res.status(200).json({ success: true, data });
});

export const getCashflow = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  const data = await reportsService.getCashflow({
    userId,
    startDate,
    endDate,
  });

  res.status(200).json({ success: true, data });
});
