const toSafeNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const titleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatRupees = (value) =>
  `₹${Math.round(toSafeNumber(value)).toLocaleString("en-IN")}`;

export const getTrendMeta = ({ totalPrediction = 0, lastMonthExpense = 0 }) => {
  const prediction = toSafeNumber(totalPrediction);
  const baseline = toSafeNumber(lastMonthExpense);

  if (prediction > baseline) {
    return {
      label: "↑ increasing",
      direction: "up",
    };
  }

  return {
    label: "↓ stable",
    direction: "down",
  };
};

export const buildCategoryPredictionItems = (categoryPrediction = {}) => {
  return Object.entries(categoryPrediction)
    .map(([category, amount]) => ({
      category: titleCase(category),
      amount: toSafeNumber(
        typeof amount === "object"
          ? (amount.amount ?? amount.predictedAmount ?? amount.value)
          : amount,
      ),
      trend:
        typeof amount === "object"
          ? amount.trend || amount.direction || "stable"
          : "stable",
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
};
