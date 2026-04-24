import { memo } from "react";
import { motion } from "framer-motion";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "../../../../utils/formatters";
import Card from "../../../../components/ui/Card";
import { MOTION_DURATION, MOTION_EASE } from "../../../../animations/variants";

const COLORS = [
  "#fda4af",
  "#7dd3fc",
  "#86efac",
  "#fde68a",
  "#fdba74",
  "#c4b5fd",
];

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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 via-blue-500/15 to-teal-500/20 text-violet-600 shadow-inner ring-1 ring-white/30 dark:text-violet-300 dark:ring-white/10">
        <PieChartIcon className="h-6 w-6" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function CategoryPieChart({ data, isLoading = false, error = "" }) {
  if (error) {
    return (
      <Card as="section" className="!p-6">
        <ChartHeader title="Category breakdown" subtitle="" />
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card as="section" className="!p-6">
        <ChartHeader title="Category breakdown" subtitle="" />
        <div className="mt-4 grid gap-3 animate-pulse">
          <div className="h-4 w-40 rounded-full bg-slate-200/80 dark:bg-white/20" />
          <div className="h-[220px] rounded-2xl bg-slate-200/60 dark:bg-white/10" />
        </div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card as="section" className="!p-6">
        <ChartHeader title="Category breakdown" subtitle="" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No expense data for this range.
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
    >
      <Card
        as="section"
        className="!p-6"
        aria-label="Category-wise expenses chart"
      >
        <ChartHeader title="Category breakdown" subtitle="" />
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={100}
                paddingAngle={2}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={1}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={28} />
            <Tooltip
              formatter={(value) => [formatCurrency(value), "Expense"]}
              labelFormatter={(label) => `Category: ${label}`}
            />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}

export default memo(CategoryPieChart);
