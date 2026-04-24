import { budgetService } from "../services/budget.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { emitBudgetUpdated } from "../realtime/socket.js";

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

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

export const getBudget = asyncHandler(async (req, res) => {
  validateMonthYear(req.query.month, req.query.year);
  const data = await budgetService.getCurrentBudget(req.query);

  res.status(200).json({
    success: true,
    data,
  });
});

export const setBudget = asyncHandler(async (req, res) => {
  const { userId, category, monthlyBudget, totalAmount, month, year } =
    req.body;
  validateMonthYear(month, year);

  if (isBlank(monthlyBudget) && isBlank(totalAmount)) {
    throw new ApiError(400, "Field 'monthlyBudget' is required");
  }

  const data = await budgetService.upsertBudget({
    userId,
    category,
    monthlyBudget,
    totalAmount,
    month,
    year,
  });
  emitBudgetUpdated(data);

  res.status(200).json({
    success: true,
    data,
  });
});

export const getBudgetSuggestions = asyncHandler(async (req, res) => {
  const { userId, monthsBack, bufferPercent } = req.query;
  const data = await budgetService.getBudgetSuggestions({
    userId,
    monthsBack,
    bufferPercent,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

export const getBudgetAlerts = asyncHandler(async (req, res) => {
  const { userId, month, year } = req.query;
  validateMonthYear(month, year);
  const data = await budgetService.getBudgetAlerts({ userId, month, year });

  res.status(200).json({
    success: true,
    data,
  });
});
