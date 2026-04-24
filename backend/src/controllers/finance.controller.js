import { asyncHandler } from "../utils/asyncHandler.js";
import { financeService } from "../services/finance.service.js";

export const getFinanceSummary = asyncHandler(async (req, res) => {
  const { userId, month, year } = req.query;
  const data = await financeService.getSummary({ userId, month, year });

  res.status(200).json({
    success: true,
    data,
  });
});
