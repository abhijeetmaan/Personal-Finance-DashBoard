export const calculateTotals = (transactions = []) =>
  transactions.reduce(
    (acc, transaction) => {
      const amount = Number(transaction.amount || 0);

      if (transaction.type === "income") {
        acc.totalIncome += amount;
      } else if (transaction.type === "expense") {
        acc.totalExpenses += amount;
      }

      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 },
  );

export const calculateSummary = (transactions = []) => {
  const { totalIncome, totalExpenses } = calculateTotals(transactions);

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  };
};
