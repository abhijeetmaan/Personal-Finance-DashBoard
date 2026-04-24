import { BUDGET_EXCLUDED_EXPENSE_SOURCES } from "../constants/financeConstants.js";
import { Budget } from "../models/Budget.js";
import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import { findCategoryByName } from "./category.service.js";
const getMonthWindow = (month, year) => {
  const monthNumber = month ? Number(month) : new Date().getUTCMonth() + 1;
  const yearNumber = year ? Number(year) : new Date().getUTCFullYear();

  if (monthNumber < 1 || monthNumber > 12) {
    throw new ApiError(400, "Month must be between 1 and 12");
  }

  return {
    monthNumber,
    yearNumber,
    start: new Date(Date.UTC(yearNumber, monthNumber - 1, 1)),
    end: new Date(Date.UTC(yearNumber, monthNumber, 1)),
  };
};

const normalizeName = (value) => String(value || "").trim();

const normalizeCategoryName = (value) => normalizeName(value);

const createMonthWindows = (monthsBack = 6) => {
  const windows = [];
  const currentUtcDate = new Date();
  const currentMonthStart = new Date(
    Date.UTC(currentUtcDate.getUTCFullYear(), currentUtcDate.getUTCMonth(), 1),
  );

  for (let offset = monthsBack; offset >= 1; offset -= 1) {
    const start = new Date(
      Date.UTC(
        currentMonthStart.getUTCFullYear(),
        currentMonthStart.getUTCMonth() - offset,
        1,
      ),
    );
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );

    windows.push({
      start,
      end,
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    });
  }

  return windows;
};

const roundTo2 = (value) => Number(Number(value || 0).toFixed(2));

const buildExpenseMonthlySeries = async ({ userId, monthsBack }) => {
  const monthWindows = createMonthWindows(monthsBack);
  const startDate = monthWindows[0].start;
  const endDate = monthWindows[monthWindows.length - 1].end;

  const groupedRows = await Transaction.aggregate([
    {
      $match: {
        type: "expense",
        date: { $gte: startDate, $lt: endDate },
        source: { $nin: BUDGET_EXCLUDED_EXPENSE_SOURCES },
        ...(userId !== null && userId !== undefined ? { userId } : {}),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          category: "$category",
        },
        amount: { $sum: "$amount" },
      },
    },
  ]);

  const seriesByCategory = new Map();
  const monthKeys = monthWindows.map((window) => window.key);

  groupedRows.forEach((row) => {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const monthIndex = monthKeys.indexOf(key);

    if (monthIndex < 0) return;

    const categoryName = normalizeName(row._id.category);
    if (!categoryName) return;

    if (!seriesByCategory.has(categoryName)) {
      seriesByCategory.set(categoryName, {
        category: categoryName,
        values: new Array(monthWindows.length).fill(0),
      });
    }

    const series = seriesByCategory.get(categoryName);
    series.values[monthIndex] =
      Number(series.values[monthIndex] || 0) + Number(row.amount || 0);
  });

  return {
    monthWindows,
    seriesByCategory,
  };
};

const buildBudgetAlertsFromCategories = (categories = []) =>
  categories
    .filter((item) => Number(item.budget) > 0)
    .flatMap((item) => {
      const percentage = Number(item.percentage || 0);

      if (percentage > 100) {
        return [
          {
            category: item.category,
            message: `You exceeded your ${item.category} budget by ${Math.round(
              percentage - 100,
            )}%`,
            type: "danger",
            spent: item.spent,
            budget: item.budget,
            percentage,
          },
        ];
      }

      if (percentage > 80) {
        return [
          {
            category: item.category,
            message: `You have used ${Math.round(
              percentage,
            )}% of your ${item.category} budget`,
            type: "warning",
            spent: item.spent,
            budget: item.budget,
            percentage,
          },
        ];
      }

      return [];
    });

const getCurrentMonthExpenseBreakdown = async ({ start, end, userId }) => {
  const match = {
    type: "expense",
    date: { $gte: start, $lt: end },
    source: { $nin: BUDGET_EXCLUDED_EXPENSE_SOURCES },
  };

  if (userId !== null && userId !== undefined) {
    match.userId = userId;
  }

  const result = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        spent: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        spent: 1,
      },
    },
    { $sort: { spent: -1 } },
  ]);

  return result;
};

const buildBudgetPayload = ({ category, budgetAmount, spentAmount }) => {
  const remaining = budgetAmount - spentAmount;
  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

  return {
    category,
    budget: budgetAmount,
    spent: spentAmount,
    remaining,
    percentage,
    isOverBudget: remaining < 0,
  };
};

const normalizeBudgetResponse = ({
  categories,
  totalBudget,
  totalSpent,
  month,
  year,
}) => ({
  categories,
  totalBudget,
  totalSpent,
  remaining: totalBudget - totalSpent,
  month,
  year,

  // Legacy aliases for existing dashboard consumers.
  monthlyBudget: totalBudget,
  budgetUsed: totalSpent,
  remainingAmount: totalBudget - totalSpent,
  totalAmount: totalBudget,
  usedAmount: totalSpent,
  percentageUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
  progressPercentage: Math.min(
    Math.max(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0, 0),
    100,
  ),
  usagePercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
  insight:
    totalBudget > 0 && totalSpent > totalBudget
      ? "You are overspending"
      : "You are on track",
});

const getUserFilter = (userId) => (userId ? userId : null);

const normalizeBudget = (budgetDoc, usedAmount) => {
  const monthlyBudget = Number(
    budgetDoc?.monthlyBudget ?? budgetDoc?.totalAmount ?? 0,
  );
  const remaining = monthlyBudget - usedAmount;
  const percentageUsed =
    monthlyBudget > 0 ? (usedAmount / monthlyBudget) * 100 : 0;
  const progressPercentage = Math.min(Math.max(percentageUsed, 0), 100);
  const insight =
    percentageUsed > 80 ? "You are overspending" : "You are on track";

  return {
    userId: budgetDoc?.userId || null,
    month: budgetDoc?.month || null,
    year: budgetDoc?.year || null,
    monthlyBudget,
    budgetUsed: usedAmount,
    remaining,
    percentageUsed,
    progressPercentage,
    insight,

    // Legacy aliases for existing frontend consumers.
    totalAmount: monthlyBudget,
    usedAmount,
    remainingAmount: remaining,
    usagePercentage: percentageUsed,
  };
};

export const budgetService = {
  async getCurrentBudget({ userId, month, year }) {
    const { monthNumber, yearNumber, start, end } = getMonthWindow(month, year);
    const userFilter = userId || null;
    const [categoryDocs, budgetDocs, expenseBreakdown] = await Promise.all([
      Category.find({ userId: userFilter }).sort({ name: 1 }).lean(),
      Budget.find({ userId: userFilter, month: monthNumber, year: yearNumber })
        .sort({ category: 1 })
        .lean(),
      getCurrentMonthExpenseBreakdown({ start, end, userId: userFilter }),
    ]);

    const expenseMap = new Map(
      expenseBreakdown.map((item) => [
        normalizeName(item.category),
        item.spent,
      ]),
    );
    const budgetMap = new Map(
      budgetDocs.map((item) => [normalizeCategoryName(item.category), item]),
    );

    // Only categories the user created under Manage Categories. Budget documents
    // alone must not create rows (avoids "Groceries" / "Overall" with no category).
    const categoryNames = new Set([
      ...categoryDocs.map((item) => normalizeName(item.name)),
    ]);

    const categories = Array.from(categoryNames)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right))
      .map((category) => {
        const budgetAmount = Number(
          budgetMap.get(category)?.monthlyBudget || 0,
        );
        const spentAmount = Number(expenseMap.get(category) || 0);
        return buildBudgetPayload({
          category,
          budgetAmount,
          spentAmount,
        });
      });

    const totalBudget = categories.reduce(
      (sum, item) => sum + Number(item.budget || 0),
      0,
    );
    const totalSpent = categories.reduce(
      (sum, item) => sum + Number(item.spent || 0),
      0,
    );

    return normalizeBudgetResponse({
      categories,
      totalBudget,
      totalSpent,
      month: monthNumber,
      year: yearNumber,
    });
  },

  async getBudgetSuggestions({ userId, monthsBack = 6, bufferPercent = 15 }) {
    const monthsToUse = Math.min(Math.max(Number(monthsBack) || 6, 3), 6);
    const buffer = Math.min(Math.max(Number(bufferPercent) || 15, 10), 20);
    const { monthWindows, seriesByCategory } = await buildExpenseMonthlySeries({
      userId: getUserFilter(userId),
      monthsBack: monthsToUse,
    });

    return Array.from(seriesByCategory.values())
      .map((item) => {
        const averageMonthlySpending = roundTo2(
          item.values.reduce((sum, value) => sum + Number(value || 0), 0) /
            monthWindows.length,
        );
        const suggestedBudget = roundTo2(
          averageMonthlySpending * (1 + buffer / 100),
        );

        return {
          category: item.category,
          averageMonthlySpending,
          suggestedBudget,
          monthsConsidered: monthWindows.length,
          bufferPercent: buffer,
        };
      })
      .filter((item) => item.suggestedBudget > 0)
      .sort((left, right) => right.suggestedBudget - left.suggestedBudget);
  },

  async getBudgetAlerts({ userId, month, year }) {
    const budgetSnapshot = await this.getCurrentBudget({ userId, month, year });
    return buildBudgetAlertsFromCategories(budgetSnapshot.categories).sort(
      (left, right) =>
        Number(right.percentage || 0) - Number(left.percentage || 0),
    );
  },

  async upsertBudget({
    userId,
    category,
    month,
    year,
    monthlyBudget,
    totalAmount,
  }) {
    const { monthNumber, yearNumber, start, end } = getMonthWindow(month, year);
    const budgetValue = Number(
      monthlyBudget !== undefined ? monthlyBudget : totalAmount,
    );
    const categoryName = normalizeCategoryName(category);

    if (!categoryName) {
      throw new ApiError(400, "Field 'category' is required");
    }

    const categoryDoc = await findCategoryByName({
      userId,
      name: categoryName,
    });
    if (!categoryDoc) {
      throw new ApiError(
        400,
        "Create this category under Manage Categories before setting a budget",
      );
    }

    if (Number.isNaN(budgetValue) || budgetValue < 0) {
      throw new ApiError(
        400,
        "Budget amount must be a valid number greater than or equal to 0",
      );
    }

    const budgetDoc = await Budget.findOneAndUpdate(
      {
        userId: getUserFilter(userId),
        category: categoryName,
        month: monthNumber,
        year: yearNumber,
      },
      {
        userId: getUserFilter(userId),
        category: categoryName,
        month: monthNumber,
        year: yearNumber,
        monthlyBudget: budgetValue,
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    const response = await this.getCurrentBudget({ userId, month, year });

    return response;
  },
};
