import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingDown } from "lucide-react";
import AnimatedCard from "../../../../components/ui/AnimatedCard";
import { MOTION_DURATION, MOTION_EASE } from "../../../../animations/variants";
import Skeleton from "../../../../components/ui/Skeleton";
import { formatCurrency } from "../../../../utils/formatters";

function sumExpenses(list) {
  return (list || []).reduce((sum, t) => {
    if (t.type !== "expense") return sum;
    return sum + Number(t.amount || 0);
  }, 0);
}

function SpendingComparisonChart({
  currentTransactions = [],
  comparisonTransactions = [],
  currentLabel = "This period",
  comparisonLabel = "Previous period",
  isLoading = false,
  error = "",
}) {
  const currentSpend = sumExpenses(currentTransactions);
  const prevSpend = sumExpenses(comparisonTransactions);
  const data = [
    { name: comparisonLabel, spending: Math.round(prevSpend * 100) / 100 },
    { name: currentLabel, spending: Math.round(currentSpend * 100) / 100 },
  ];

  const delta =
    prevSpend > 0 ? ((currentSpend - prevSpend) / prevSpend) * 100 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
    >
      <AnimatedCard as="section" className="!p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              <TrendingDown
                className="h-5 w-5 text-violet-500 dark:text-violet-400"
                strokeWidth={2}
                aria-hidden
              />
              Spend vs last period
            </h3>
            {delta != null && !isLoading && !error ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {delta >= 0 ? "Up" : "Down"}{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Math.abs(delta).toFixed(1)}%
                </span>{" "}
                vs previous window
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-52 w-full rounded-xl" />
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spendBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-slate-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-slate-500"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Expenses"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgb(226 232 240)",
                  }}
                />
                <Bar
                  dataKey="spending"
                  radius={[10, 10, 4, 4]}
                  fill="url(#spendBar)"
                  maxBarSize={56}
                  isAnimationActive
                  animationDuration={850}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimatedCard>
    </motion.div>
  );
}

export default SpendingComparisonChart;
