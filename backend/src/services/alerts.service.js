import { BUDGET_EXCLUDED_EXPENSE_SOURCES } from "../constants/financeConstants.js";
import { Budget } from "../models/Budget.js";
import { Card } from "../models/Card.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";

const BUDGET_USAGE_ALERT_THRESHOLD = 0.8;
const MONTHLY_SPENDING_SPIKE_THRESHOLD = 0.3;
const EARLY_MONTH_DAYS = 10;
const EARLY_MONTH_BUDGET_USAGE_THRESHOLD = 0.5;

const getMonthBounds = (month, year) => {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new ApiError(400, "Month must be between 1 and 12");
  }

  if (Number.isNaN(yearNumber) || yearNumber < 2000) {
    throw new ApiError(400, "Year must be a valid 4-digit number");
  }

  const start = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
  const end = new Date(Date.UTC(yearNumber, monthNumber, 1));

  return { monthNumber, yearNumber, start, end };
};

const getPreviousMonth = (month, year) => {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
};

const sumExpenseInRange = async (start, end, userId) => {
  const match = {
    type: "expense",
    date: { $gte: start, $lt: end },
    source: { $nin: BUDGET_EXCLUDED_EXPENSE_SOURCES },
  };

  if (userId) {
    match.userId = userId;
  }

  const result = await Transaction.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.total || 0;
};
const buildBudgetUsageAlert = ({ spent, budgetAmount }) => {
  if (!budgetAmount || budgetAmount <= 0) {
    return null;
  }

  const usageRatio = spent / budgetAmount;
  if (usageRatio <= BUDGET_USAGE_ALERT_THRESHOLD) {
    return null;
  }

  return {
    message: `You have used ${(usageRatio * 100).toFixed(1)}% of your monthly budget.`,
    type: "warning",
  };
};

const buildMonthlySpikeAlert = ({ currentSpent, previousSpent }) => {
  if (previousSpent <= 0) {
    return null;
  }

  const increaseRatio = (currentSpent - previousSpent) / previousSpent;
  if (increaseRatio <= MONTHLY_SPENDING_SPIKE_THRESHOLD) {
    return null;
  }

  return {
    message: `Current month spending is ${(increaseRatio * 100).toFixed(1)}% higher than last month.`,
    type: "warning",
  };
};

const buildEarlyMonthAlert = ({
  spentInEarlyDays,
  budgetAmount,
  dayOfMonth,
}) => {
  if (dayOfMonth >= EARLY_MONTH_DAYS) {
    return null;
  }

  if (!budgetAmount || budgetAmount <= 0) {
    return null;
  }

  const usageRatio = spentInEarlyDays / budgetAmount;
  if (usageRatio <= EARLY_MONTH_BUDGET_USAGE_THRESHOLD) {
    return null;
  }

  return {
    message: `High early-month spending detected: ${(usageRatio * 100).toFixed(1)}% of budget spent within first ${EARLY_MONTH_DAYS} days.`,
    type: "warning",
  };
};

const getDaysUntilDue = (dueDate, referenceDate = new Date()) => {
  const now = new Date(referenceDate);
  const currentDay = now.getUTCDate();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();
  const targetDay = Math.min(Math.max(Number(dueDate) || 1, 1), 31);

  let due = new Date(Date.UTC(currentYear, currentMonth, targetDay));
  if (targetDay < currentDay) {
    due = new Date(Date.UTC(currentYear, currentMonth + 1, targetDay));
  }

  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const buildCardAlerts = async ({ userId }) => {
  const cards = await Card.find({
    userId: userId || null,
    isActive: true,
  }).lean();
  const usageRows = await Transaction.aggregate([
    {
      $match: {
        userId: userId || null,
        cardId: { $in: cards.map((card) => card._id) },
        type: "expense",
      },
    },
    {
      $group: {
        _id: "$cardId",
        usedAmount: { $sum: "$amount" },
      },
    },
  ]);
  const usageByCardId = new Map(
    usageRows.map((row) => [String(row._id), Number(row.usedAmount || 0)]),
  );

  return cards.flatMap((card) => {
    if (card.type !== "credit") {
      return [];
    }

    const limit = Number(card.limit || 0);
    const usedAmount = Number(usageByCardId.get(String(card._id)) || 0);
    const usagePercentage = limit > 0 ? (usedAmount / limit) * 100 : 0;
    const daysUntilDue = getDaysUntilDue(card.dueDate);
    const alerts = [];

    if (usagePercentage >= 80) {
      alerts.push({
        message: `${card.name} is ${usagePercentage.toFixed(0)}% used.`,
        type: usagePercentage >= 100 ? "danger" : "warning",
      });
    }

    if (usedAmount > 0 && daysUntilDue >= 0 && daysUntilDue <= 3) {
      alerts.push({
        message: `Your ${card.name} bill is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`,
        type: "warning",
      });
    }

    return alerts;
  });
};

export const alertsService = {
  async getDynamicAlerts({ userId, month, year }) {
    const now = new Date();
    const targetMonth = month ? Number(month) : now.getUTCMonth() + 1;
    const targetYear = year ? Number(year) : now.getUTCFullYear();

    const { monthNumber, yearNumber, start, end } = getMonthBounds(
      targetMonth,
      targetYear,
    );
    const { month: previousMonth, year: previousYear } = getPreviousMonth(
      monthNumber,
      yearNumber,
    );
    const { start: previousStart, end: previousEnd } = getMonthBounds(
      previousMonth,
      previousYear,
    );

    const [budget, currentTotalSpent, previousTotalSpent] = await Promise.all([
      Budget.findOne({
        userId: userId || null,
        month: monthNumber,
        year: yearNumber,
      }),
      sumExpenseInRange(start, end, userId),
      sumExpenseInRange(previousStart, previousEnd, userId),
    ]);

    const budgetAmount = Number(
      budget?.monthlyBudget ?? budget?.totalAmount ?? 0,
    );

    const earlyEnd = new Date(
      Date.UTC(yearNumber, monthNumber - 1, EARLY_MONTH_DAYS + 1),
    );
    const spentInEarlyDays = await sumExpenseInRange(start, earlyEnd, userId);

    const [cardAlerts] = await Promise.all([buildCardAlerts({ userId })]);

    const alerts = [];

    const budgetAlert = buildBudgetUsageAlert({
      spent: currentTotalSpent,
      budgetAmount,
    });
    if (budgetAlert) alerts.push(budgetAlert);

    const monthlySpikeAlert = buildMonthlySpikeAlert({
      currentSpent: currentTotalSpent,
      previousSpent: previousTotalSpent,
    });
    if (monthlySpikeAlert) alerts.push(monthlySpikeAlert);

    const dayReference =
      monthNumber === now.getUTCMonth() + 1 &&
      yearNumber === now.getUTCFullYear()
        ? now.getUTCDate()
        : EARLY_MONTH_DAYS;

    const earlyAlert = buildEarlyMonthAlert({
      spentInEarlyDays,
      budgetAmount,
      dayOfMonth: dayReference,
    });
    if (earlyAlert) alerts.push(earlyAlert);

    alerts.push(...cardAlerts);

    return alerts;
  },
};
