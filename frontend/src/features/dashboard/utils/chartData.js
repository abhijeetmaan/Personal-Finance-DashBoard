const getMonthLabel = (date) =>
  date.toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });

const toSafeAmount = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const groupExpensesByCategory = (transactions) => {
  const grouped = transactions.reduce((acc, transaction) => {
    if (transaction.type !== "expense") return acc;

    const category = String(transaction.category || "").trim();
    if (!category) return acc;

    const amount = toSafeAmount(transaction.amount);
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
};

export const groupMonthlyExpenses = (transactions, monthsCount = 6) => {
  const safeMonthsCount = Math.max(Number(monthsCount) || 6, 1);
  const now = new Date();
  const monthKeys = [];

  for (let i = safeMonthsCount - 1; i >= 0; i -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    monthKeys.push({ key, label: getMonthLabel(date) });
  }

  const grouped = new Map(
    monthKeys.map((month) => [month.key, { label: month.label, amount: 0 }]),
  );

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    if (!isValidDate(transaction.date)) return;

    const date = new Date(transaction.date);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!grouped.has(key)) return;

    grouped.get(key).amount += toSafeAmount(transaction.amount);
  });

  return monthKeys.map((month) => {
    const monthEntry = grouped.get(month.key);

    return {
      ...monthEntry,
      amount: Number(monthEntry.amount.toFixed(2)),
    };
  });
};
