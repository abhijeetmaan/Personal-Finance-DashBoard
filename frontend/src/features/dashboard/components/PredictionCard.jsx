import { memo } from "react";
import { formatRupees, getTrendMeta } from "../utils/predictions";
import AnimatedCard from "../../../components/ui/AnimatedCard";

function PredictionCard({
  totalPrediction = 0,
  lastMonthExpense = 0,
  isLoading = false,
  error = "",
}) {
  const trend = getTrendMeta({ totalPrediction, lastMonthExpense });

  if (error) {
    return (
      <AnimatedCard
        as="section"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Expense Prediction
        </h2>
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      </AnimatedCard>
    );
  }

  if (isLoading) {
    return (
      <AnimatedCard
        as="section"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Expense Prediction
        </h2>
        <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-700/40 dark:bg-sky-500/10 dark:text-sky-300">
          Loading prediction...
        </p>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard
      as="section"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800"
      aria-label="Expense prediction"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Expense Prediction
        </h2>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-lg dark:bg-sky-500/20"
          aria-hidden="true"
        >
          📈
        </span>
      </div>

      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {formatRupees(totalPrediction)}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Next month expected spending: {formatRupees(totalPrediction)}
      </p>

      <p
        className={[
          "mt-3 text-sm font-semibold",
          trend.direction === "up"
            ? "text-rose-600 dark:text-rose-300"
            : "text-sky-600 dark:text-sky-300",
        ].join(" ")}
      >
        {trend.label}
      </p>
    </AnimatedCard>
  );
}

export default memo(PredictionCard);
