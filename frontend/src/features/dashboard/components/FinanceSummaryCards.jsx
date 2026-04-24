import { CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import SummaryCard from "./SummaryCard";

function FinanceSummaryCards({
  financeSummary = null,
  periodIncome = 0,
  periodExpense = 0,
  isLoading = false,
  error = "",
}) {
  const creditUsed = financeSummary?.totalCreditUsed ?? 0;
  const backendPeriodIncome = financeSummary?.periodIncome;
  const backendPeriodExpense = financeSummary?.periodExpense;
  const income =
    backendPeriodIncome !== undefined && backendPeriodIncome !== null
      ? backendPeriodIncome
      : periodIncome;
  const expense =
    backendPeriodExpense !== undefined && backendPeriodExpense !== null
      ? backendPeriodExpense
      : periodExpense;

  const utilWarning = financeSummary?.highCreditUtilizationWarning;

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-3" aria-label="Key metrics">
      {utilWarning ? (
        <p className="col-span-full rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 backdrop-blur-sm dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-100">
          {utilWarning.message}
        </p>
      ) : null}

      {error ? (
        <p
          className="col-span-full rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 backdrop-blur-sm dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : (
        <>
          <SummaryCard
            icon={TrendingUp}
            title="Income"
            amount={income}
            tone="income"
            isLoading={isLoading}
            variant="fintech"
          />
          <SummaryCard
            icon={TrendingDown}
            title="Expense"
            amount={expense}
            tone="expense"
            isLoading={isLoading}
            variant="fintech"
          />
          <SummaryCard
            icon={CreditCard}
            title="Credit usage"
            amount={creditUsed}
            tone="credit"
            isLoading={isLoading}
            variant="fintech"
          />
        </>
      )}
    </section>
  );
}

export default FinanceSummaryCards;
