import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import { REPORT_EXCLUDED_SOURCES } from "../constants/financeConstants.js";

const round2 = (value) => Number(Number(value || 0).toFixed(2));

const parseDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required (ISO strings)");
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date range");
  }
  if (start > end) {
    throw new ApiError(400, "startDate cannot be after endDate");
  }
  return { start, end };
};

const buildUserMatch = (userId) => {
  if (userId !== undefined && userId !== null && String(userId).trim() !== "") {
    return { userId };
  }
  return { userId: null };
};

export const reportsService = {
  /**
   * P&L from transactions (source of truth), excluding internal ledger-only sources.
   */
  async getProfitAndLoss({ userId = null, startDate, endDate } = {}) {
    const { start, end } = parseDateRange(startDate, endDate);

    const match = {
      ...buildUserMatch(userId),
      date: { $gte: start, $lte: end },
      source: { $nin: REPORT_EXCLUDED_SOURCES },
    };

    const aggRows = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of aggRows) {
      if (row._id === "income") {
        totalIncome = round2(row.total);
      } else if (row._id === "expense") {
        totalExpense = round2(row.total);
      }
    }

    const netProfit = round2(totalIncome - totalExpense);

    return {
      totalIncome,
      totalExpense,
      netProfit,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  },

  /**
   * Cashflow summary (same filters as P&L for this app’s transaction model).
   */
  async getCashflow({ userId = null, startDate, endDate } = {}) {
    const pnl = await this.getProfitAndLoss({ userId, startDate, endDate });
    const inflow = pnl.totalIncome;
    const outflow = pnl.totalExpense;
    const netFlow = round2(inflow - outflow);

    return {
      inflow,
      outflow,
      netFlow,
      startDate: pnl.startDate,
      endDate: pnl.endDate,
    };
  },
};
