function InsightsCards({ insights, comparison }) {
  const monthlyExpense = insights?.monthlyTotalExpense || 0;
  const highestCategory = insights?.categoryBreakdown?.[0];
  const change = comparison?.percentageChange || 0;

  const cards = [
    {
      label: "Monthly Expense",
      value: `Rs ${monthlyExpense.toFixed(2)}`,
      hint: "Current month spend",
    },
    {
      label: "Top Category",
      value: highestCategory ? highestCategory.category : "N/A",
      hint: highestCategory
        ? `Rs ${highestCategory.total.toFixed(2)}`
        : "No transactions yet",
    },
    {
      label: "Vs Previous Month",
      value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      hint: change >= 0 ? "Spending increased" : "Spending reduced",
    },
  ];

  return (
    <section className="insights-grid">
      {cards.map((card) => (
        <article key={card.label} className="insight-card">
          <p className="insight-label">{card.label}</p>
          <h3 className="insight-value">{card.value}</h3>
          <p className="insight-hint">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

export default InsightsCards;
