import { alertsService } from "../services/alerts.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const validateMonthYear = (month, year) => {
  if (month !== undefined) {
    const monthNumber = Number(month);
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      throw new ApiError(400, "Month must be an integer between 1 and 12");
    }
  }

  if (year !== undefined) {
    const yearNumber = Number(year);
    if (!Number.isInteger(yearNumber) || yearNumber < 2000) {
      throw new ApiError(400, "Year must be a valid integer (>= 2000)");
    }
  }
};

export const getAlerts = asyncHandler(async (req, res) => {
  const { userId, month, year } = req.query;
  validateMonthYear(month, year);

  const data = await alertsService.getDynamicAlerts({ userId, month, year });

  res.status(200).json({
    success: true,
    data,
  });
});
