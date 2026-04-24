import { Crown, PieChart } from "lucide-react";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import Badge from "../../../components/ui/Badge";
import { formatCurrency } from "../../../utils/formatters";

function TopCategoryCard({ topCategory, isLoading = false, error = "" }) {
  if (isLoading) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <PieChart className="h-5 w-5 animate-pulse" strokeWidth={2} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Top spending
          </h2>
        </div>
        <p className="mt-4 rounded-2xl border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          Loading analytics…
        </p>
      </AnimatedCard>
    );
  }

  if (error) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Top spending
        </h2>
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      </AnimatedCard>
    );
  }

  const hasSpend = Number(topCategory?.amount) > 0;

  return (
    <AnimatedCard
      as="section"
      className="relative !overflow-hidden !p-0 ring-1 ring-violet-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-blue-600/10 to-teal-500/15" />
      <div className="relative z-[1] p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
              <Crown className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Top spending
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This month&apos;s leader
              </p>
            </div>
          </div>
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">
            {topCategory?.icon || "💰"}
          </span>
        </div>

        <p className="mt-5 bg-gradient-to-r from-violet-700 via-blue-700 to-teal-600 bg-clip-text text-2xl font-bold text-transparent dark:from-violet-200 dark:via-blue-200 dark:to-teal-200">
          {topCategory?.topCategory || "No data yet"}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {hasSpend
            ? `You spent ${formatCurrency(topCategory.amount)} here this month.`
            : "Add expenses to see your top spending category."}
        </p>

        {topCategory?.topCategory && hasSpend ? (
          <Badge variant="info" className="mt-4">
            Highlight · {topCategory.icon || "💰"} {topCategory.topCategory}
          </Badge>
        ) : null}
      </div>
    </AnimatedCard>
  );
}

export default TopCategoryCard;
