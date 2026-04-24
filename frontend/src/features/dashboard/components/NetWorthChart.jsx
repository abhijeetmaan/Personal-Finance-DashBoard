import { useId, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../../components/ui/Card";
import { formatCurrency } from "../../../utils/formatters";
import { MOTION_DURATION, MOTION_EASE } from "../../../animations/variants";

const GREEN = "#10b981";
const GREEN_SOFT = "#34d399";
const RED = "#f43f5e";
const RED_SOFT = "#fb7185";

function NetWorthChart({ data, isLoading = false, error = "" }) {
  const rawId = useId();
  const gradId = `nw-fill-${rawId.replace(/:/g, "")}`;
  const strokeId = `nw-stroke-${rawId.replace(/:/g, "")}`;

  const series = Array.isArray(data) ? data : [];

  const growthPositive = useMemo(() => {
    if (series.length < 2) return true;
    const first = Number(series[0]?.netWorth ?? 0);
    const last = Number(series[series.length - 1]?.netWorth ?? 0);
    return last >= first;
  }, [series]);

  const stroke = growthPositive ? GREEN : RED;
  const strokeSoft = growthPositive ? GREEN_SOFT : RED_SOFT;

  if (error) {
    return (
      <Card as="section" className="!p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Net Worth Trend
        </h2>
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card as="section" className="!p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/10" />
        <div className="h-[260px] animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/10" />
      </Card>
    );
  }

  if (!series.length) {
    return (
      <Card as="section" className="!p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Net Worth Trend
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Connect activity to see your balance over time.
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
    >
      <Card as="section" className="!p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Net Worth Trend
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Last 12 months
            </p>
          </div>
          <div
            className={[
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              growthPositive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
            ].join(" ")}
          >
            {growthPositive ? (
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {growthPositive ? "Up in period" : "Down in period"}
          </div>
        </div>

        <div className="h-[min(320px,45vh)] w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={strokeSoft}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor={strokeSoft}
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={strokeSoft} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-slate-700"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-slate-500 dark:text-slate-400"
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-slate-500 dark:text-slate-400"
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(v) =>
                  `Rs ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                }
              />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(value),
                  "Net worth",
                ]}
                labelFormatter={(label) => label}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid rgb(226 232 240)",
                  boxShadow: "0 10px 40px -12px rgba(15,23,42,0.2)",
                }}
                animationDuration={200}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke={`url(#${strokeId})`}
                strokeWidth={2.75}
                fill={`url(#${gradId})`}
                fillOpacity={1}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#fff",
                  fill: stroke,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "#fff",
                  fill: strokeSoft,
                }}
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}

export default NetWorthChart;
