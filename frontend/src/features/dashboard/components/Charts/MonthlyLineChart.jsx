import { memo } from "react";
import { motion } from "framer-motion";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../../../utils/formatters";
import AnimatedCard from "../../../../components/ui/AnimatedCard";
import { MOTION_DURATION, MOTION_EASE } from "../../../../animations/variants";

function ChartHeader({ title, subtitle }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-teal-500/15 to-violet-500/20 text-teal-600 shadow-inner ring-1 ring-white/30 dark:text-teal-300 dark:ring-white/10">
        <LineChartIcon className="h-6 w-6" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function MonthlyLineChart({ data, isLoading = false, error = "" }) {
  if (error) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <ChartHeader title="Monthly spend" subtitle="" />
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      </AnimatedCard>
    );
  }

  if (isLoading) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <ChartHeader title="Monthly spend" subtitle="" />
        <div className="mt-4 space-y-3 animate-pulse">
          <div className="h-4 w-44 rounded-full bg-slate-200/80 dark:bg-white/20" />
          <div className="h-[220px] rounded-2xl bg-slate-200/60 dark:bg-white/10" />
        </div>
      </AnimatedCard>
    );
  }

  const hasData = data.some(
    (item) => Number(item.value || item.amount || 0) > 0,
  );

  if (!data.length) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <ChartHeader title="Monthly spend" subtitle="" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No monthly data available yet.
        </p>
      </AnimatedCard>
    );
  }

  if (!hasData) {
    return (
      <AnimatedCard as="section" className="!p-6">
        <ChartHeader title="Monthly spend" subtitle="" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No expense trend to show yet.
        </p>
      </AnimatedCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
    >
      <AnimatedCard
        as="section"
        className="!p-6"
        aria-label="Monthly spending trend chart"
      >
        <ChartHeader title="Monthly spend" subtitle="" />
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 16, right: 18, left: 0, bottom: 0 }}
            >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.28)"
            />
            <XAxis dataKey="month" stroke="#64748b" tickMargin={8} />
            <YAxis
              stroke="#64748b"
              tickFormatter={(value) => `₹${Number(value || 0).toFixed(0)}`}
              width={72}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), "Expense"]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.35)",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Expense"
              stroke="url(#lineGradient)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnimatedCard>
    </motion.div>
  );
}

export default memo(MonthlyLineChart);
