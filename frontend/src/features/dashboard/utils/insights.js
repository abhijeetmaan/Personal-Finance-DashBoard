import { formatCurrency } from "../../../utils/formatters";

export const getMonthWindow = (date) => {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );
  return { start, end };
};

export const isWithinRange = (dateValue, start, end) => {
  const date = new Date(dateValue);
  return date >= start && date < end;
};

export const getExpenseTotal = (transactions) =>
  transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

export const getHighestSpendingCategory = (transactions) => {
  const grouped = transactions.reduce((acc, transaction) => {
    if (transaction.type !== "expense") return acc;

    const category = String(transaction.category || "").trim();
    if (!category) return acc;

    acc[category] = (acc[category] || 0) + Number(transaction.amount || 0);
    return acc;
  }, {});

  const [category, total] =
    Object.entries(grouped).sort((a, b) => b[1] - a[1])[0] || [];

  return {
    category: category || "N/A",
    amount: total || 0,
  };
};

export const calculatePercentageIncreaseVsLastMonth = (
  transactions,
  referenceDate = new Date(),
) => {
  const { start: currentStart, end: currentEnd } =
    getMonthWindow(referenceDate);
  const previousReference = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() - 1,
      1,
    ),
  );
  const { start: previousStart, end: previousEnd } =
    getMonthWindow(previousReference);

  const currentMonthTransactions = transactions.filter((transaction) =>
    isWithinRange(transaction.date, currentStart, currentEnd),
  );
  const previousMonthTransactions = transactions.filter((transaction) =>
    isWithinRange(transaction.date, previousStart, previousEnd),
  );

  const currentExpense = getExpenseTotal(currentMonthTransactions);
  const previousExpense = getExpenseTotal(previousMonthTransactions);

  const percentageIncrease =
    previousExpense > 0
      ? ((currentExpense - previousExpense) / previousExpense) * 100
      : 0;

  return {
    percentageIncrease,
    currentMonthTransactions,
    currentExpense,
  };
};

export const calculateAverageDailySpending = (
  currentExpense,
  referenceDate = new Date(),
) => {
  const currentDayOfMonth = Math.max(referenceDate.getUTCDate(), 1);
  return currentExpense / currentDayOfMonth;
};

export const roundPercentage = (value) => Number((value || 0).toFixed(0));

export const buildHumanReadableInsights = ({
  percentageIncrease,
  highestCategory,
  averageDailySpending,
}) => {
  const percentageAbs = Math.abs(roundPercentage(percentageIncrease));

  return {
    spendingChange:
      percentageIncrease >= 0
        ? `Spending increased by ${percentageAbs}%`
        : `Spending decreased by ${percentageAbs}%`,
    topCategory:
      highestCategory.category === "N/A"
        ? "No dominant spending category yet"
        : `You spend most on ${highestCategory.category}`,
    averageDaily: `Average daily spending is ${averageDailySpending.toFixed(2)}`,
  };
};

const getBudgetLimit = (budget) =>
  Number(budget?.monthlyBudget ?? budget?.totalAmount ?? 0);

const getBudgetInsight = (currentExpense, budget) => {
  const budgetLimit = getBudgetLimit(budget);

  if (budgetLimit <= 0) {
    return {
      icon: "💼",
      title: "Budget status",
      message: "Set a monthly budget to get smarter spending guidance.",
      tone: "neutral",
    };
  }

  if (currentExpense > budgetLimit) {
    return {
      icon: "⚠️",
      title: "Budget status",
      message: "You might exceed your budget this month.",
      tone: "negative",
    };
  }

  if (currentExpense >= budgetLimit * 0.8) {
    return {
      icon: "⚠️",
      title: "Budget status",
      message: "You are close to your budget limit this month.",
      tone: "negative",
    };
  }

  return {
    icon: "✅",
    title: "Budget status",
    message: "You are on track with your budget.",
    tone: "positive",
  };
};

export const generateInsights = (
  transactions = [],
  budget = null,
  referenceDate = new Date(),
) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const { percentageIncrease, currentMonthTransactions, currentExpense } =
    calculatePercentageIncreaseVsLastMonth(transactions, referenceDate);
  const highestCategory = getHighestSpendingCategory(currentMonthTransactions);
  const averageDailySpending = calculateAverageDailySpending(
    currentExpense,
    referenceDate,
  );

  const insights = [
    {
      icon: percentageIncrease >= 0 ? "📈" : "📉",
      title: "Monthly spending",
      message:
        percentageIncrease >= 0
          ? `Your spending increased by ${Math.abs(roundPercentage(percentageIncrease))}% compared to last month.`
          : `Your spending decreased by ${Math.abs(roundPercentage(percentageIncrease))}% compared to last month.`,
      tone: percentageIncrease > 0 ? "negative" : "positive",
    },
  ];

  if (highestCategory.amount > 0) {
    insights.push({
      icon: "💡",
      title: "Top category",
      message: `You spend the most on ${highestCategory.category} this month.`,
      tone: "neutral",
    });
  }

  insights.push(getBudgetInsight(currentExpense, budget));

  insights.push({
    icon: "🧮",
    title: "Daily average",
    message: `Your average daily spending is ${formatCurrency(
      averageDailySpending,
    )}.`,
    tone: "neutral",
  });

  return insights;
};

export const buildInsightsFromTransactions = (
  transactions,
  referenceDate = new Date(),
) => {
  const { percentageIncrease, currentMonthTransactions, currentExpense } =
    calculatePercentageIncreaseVsLastMonth(transactions, referenceDate);
  const highestCategory = getHighestSpendingCategory(currentMonthTransactions);
  const averageDailySpending = calculateAverageDailySpending(
    currentExpense,
    referenceDate,
  );
  const humanReadable = buildHumanReadableInsights({
    percentageIncrease,
    highestCategory,
    averageDailySpending,
  });

  return {
    percentageIncrease,
    highestCategory,
    averageDailySpending,
    humanReadable,
  };
};
