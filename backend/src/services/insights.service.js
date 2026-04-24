import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";

const getMonthWindow = (month, year) => {
  const now = new Date();
  const monthNumber = month ? Number(month) : now.getUTCMonth() + 1;
  const yearNumber = year ? Number(year) : now.getUTCFullYear();

  if (monthNumber < 1 || monthNumber > 12) {
    throw new ApiError(400, "Month must be between 1 and 12");
  }

  const start = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
  const end = new Date(Date.UTC(yearNumber, monthNumber, 1));

  return { start, end, monthNumber, yearNumber };
};

export const insightsService = {
  async getExpenseInsights({ month, year }) {
    const { start, end, monthNumber, yearNumber } = getMonthWindow(month, year);

    const [monthlyTotals, categoryBreakdown] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            type: "expense",
            date: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: null,
            monthlyTotalExpense: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            type: "expense",
            date: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            total: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      month: monthNumber,
      year: yearNumber,
      monthlyTotalExpense: monthlyTotals[0]?.monthlyTotalExpense || 0,
      categoryBreakdown,
    };
  },

  async getSpendingComparison({ month, year }) {
    const { monthNumber, yearNumber } = getMonthWindow(month, year);

    const currentStart = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
    const currentEnd = new Date(Date.UTC(yearNumber, monthNumber, 1));

    const previousMonth = monthNumber === 1 ? 12 : monthNumber - 1;
    const previousYear = monthNumber === 1 ? yearNumber - 1 : yearNumber;
    const previousStart = new Date(
      Date.UTC(previousYear, previousMonth - 1, 1),
    );
    const previousEnd = new Date(Date.UTC(previousYear, previousMonth, 1));

    const [currentAgg, previousAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            type: "expense",
            date: { $gte: currentStart, $lt: currentEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            type: "expense",
            date: { $gte: previousStart, $lt: previousEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const currentTotal = currentAgg[0]?.total || 0;
    const previousTotal = previousAgg[0]?.total || 0;

    const percentageChange =
      previousTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : ((currentTotal - previousTotal) / previousTotal) * 100;

    return {
      currentMonth: {
        month: monthNumber,
        year: yearNumber,
        totalExpense: currentTotal,
      },
      previousMonth: {
        month: previousMonth,
        year: previousYear,
        totalExpense: previousTotal,
      },
      percentageChange,
    };
  },
};
