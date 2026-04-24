export const getLastSixMonthsTrend = (transactions) => {
  const now = new Date();
  const keys = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    keys.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }

  const monthMap = new Map(
    keys.map((k) => [k.key, { label: k.label, total: 0 }]),
  );

  transactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const date = new Date(tx.date);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      if (monthMap.has(key)) {
        monthMap.get(key).total += Number(tx.amount || 0);
      }
    });

  return keys.map((k) => ({
    label: monthMap.get(k.key).label,
    total: monthMap.get(k.key).total,
  }));
};
