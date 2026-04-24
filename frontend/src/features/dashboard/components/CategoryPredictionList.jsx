import { memo } from "react";
import {
  buildCategoryPredictionItems,
  formatRupees,
} from "../utils/predictions";
import AnimatedCard from "../../../components/ui/AnimatedCard";

function CategoryPredictionList({
  categoryPrediction = {},
  categoryTrends = {},
  isLoading = false,
  error = "",
}) {
  const items = buildCategoryPredictionItems(
    Object.entries(categoryPrediction).reduce((acc, [category, amount]) => {
      acc[category] = {
        amount,
        trend: categoryTrends[category],
      };
      return acc;
    }, {}),
  );

  if (error) {
    return (
      <AnimatedCard
        as="section"
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Category Forecast
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
          Category Forecast
        </h2>
        <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-700/40 dark:bg-sky-500/10 dark:text-sky-300">
          Loading category forecast...
        </p>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard
      as="section"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800"
      aria-label="Category prediction"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Category Forecast
        </h2>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-lg dark:bg-cyan-500/20"
          aria-hidden="true"
        >
          🧠
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No category forecast available yet.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {items.map((item) => (
            <li
              key={item.category}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm transition duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
            >
              <span className="flex items-center gap-2">
                <span>{item.category}</span>
                <span
                  className={[
                    "text-xs font-bold",
                    item.trend === "up"
                      ? "text-rose-600 dark:text-rose-300"
                      : item.trend === "down"
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-slate-500 dark:text-slate-400",
                  ].join(" ")}
                >
                  {item.trend === "up"
                    ? "↑"
                    : item.trend === "down"
                      ? "↓"
                      : "→"}
                </span>
              </span>
              <strong className="text-slate-900 dark:text-white">
                {formatRupees(item.amount)}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </AnimatedCard>
  );
}

export default memo(CategoryPredictionList);
