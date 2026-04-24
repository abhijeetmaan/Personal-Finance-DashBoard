import { memo, useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import { formatCurrency } from "../../../utils/formatters";
import {
  getExpenseTotal,
  getMonthWindow,
  isWithinRange,
  roundPercentage,
} from "../utils/insights";

function ProductInsightsStrip({
  netAvailable = 0,
  periodIncome = 0,
  periodExpense = 0,
  topCategory = null,
  insightTransactions = [],
  trendLabel = "This month vs last",
  isLoading = false,
}) {
  const savingsRate = useMemo(() => {
    const income = Number(periodIncome) || 0;
    const expense = Number(periodExpense) || 0;
    if (income <= 0) return null;
    return roundPercentage(((income - expense) / income) * 100);
  }, [periodIncome, periodExpense]);

  const spendingNarrative = useMemo(() => {
    const ref = new Date();
    const { start: curStart, end: curEnd } = getMonthWindow(ref);
    const prevAnchor = new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 1, 1),
    );
    const { start: prevStart, end: prevEnd } = getMonthWindow(prevAnchor);

    const prevExp = getExpenseTotal(
      insightTransactions.filter((t) =>
        isWithinRange(t.date, prevStart, prevEnd),
      ),
    );
    const curExp = getExpenseTotal(
      insightTransactions.filter((t) =>
        isWithinRange(t.date, curStart, curEnd),
      ),
    );

    if (prevExp <= 0 && curExp <= 0) {
      return "Add expenses to unlock month-over-month insights.";
    }
    if (prevExp <= 0 && curExp > 0) {
      return "First month of tracked spending—trends will appear next month.";
    }

    const pct = ((curExp - prevExp) / prevExp) * 100;
    const rounded = Math.abs(roundPercentage(pct));
    if (pct >= 0) {
      return `You spent ${rounded}% more this month than last.`;
    }
    return `You spent ${rounded}% less this month than last.`;
  }, [insightTransactions]);

  const topCategoryLabel = topCategory?.topCategory?.trim() || "";
  const topCategoryAmount = Number(topCategory?.amount) || 0;

  if (isLoading) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/10" />
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard as="section" className="!p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-teal-500/20 text-violet-600 dark:text-violet-300">
          <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Plain-language snapshot · {trendLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/30 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net balance</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {formatCurrency(netAvailable)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Cash & accounts minus credit used
          </p>
        </div>

        <div className="rounded-2xl border border-white/30 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <PiggyBank className="h-4 w-4" strokeWidth={2} aria-hidden />
            Savings rate
          </div>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {savingsRate === null ? "—" : `${savingsRate}%`}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {savingsRate === null
              ? "Need income this month to calculate"
              : "Share of income left after expenses"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/30 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-4 w-4" strokeWidth={2} aria-hidden />
            Top category
          </div>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {topCategoryLabel || "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {topCategoryAmount > 0
              ? `${formatCurrency(topCategoryAmount)} this month`
              : "No expense categories yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 dark:border-emerald-500/20">
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {spendingNarrative.includes("less") ? (
              <ArrowDownRight className="h-4 w-4" strokeWidth={2} />
            ) : (
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            )}
            Monthly trend
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
            {spendingNarrative}
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

export default memo(ProductInsightsStrip);
