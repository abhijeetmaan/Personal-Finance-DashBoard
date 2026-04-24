import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnimatedCard from "../components/ui/AnimatedCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { reportsService } from "../features/reports/services/reportsService";
import { formatCurrency } from "../utils/formatters";

function monthBoundsISO(year, monthIndex) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function ReportsPage() {
  const now = useMemo(() => new Date(), []);
  const defaultMonth = now.getUTCMonth();
  const defaultYear = now.getUTCFullYear();

  const [month, setMonth] = useState(String(defaultMonth + 1));
  const [year, setYear] = useState(String(defaultYear));
  const [pnl, setPnl] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { startISO, endISO } = useMemo(() => {
    const m = Math.min(12, Math.max(1, Number(month) || 1));
    const y = Number(year) || defaultYear;
    return monthBoundsISO(y, m - 1);
  }, [month, year, defaultYear]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { startDate: startISO, endDate: endISO };
      const [pnlData, cfData] = await Promise.all([
        reportsService.getPnl(params),
        reportsService.getCashflow(params),
      ]);
      setPnl(pnlData);
      setCashflow(cfData);
    } catch (err) {
      setPnl(null);
      setCashflow(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [startISO, endISO]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const chartData = useMemo(() => {
    if (!cashflow) return [];
    return [
      {
        name: "Period",
        Inflow: Number(cashflow.inflow || 0),
        Outflow: Number(cashflow.outflow || 0),
      },
    ];
  }, [cashflow]);

  const insight = useMemo(() => {
    if (!pnl) return null;
    const net = Number(pnl.netProfit || 0);
    if (net >= 0) {
      return {
        tone: "positive",
        text: `You saved ${formatCurrency(net)} this period (income minus expenses, excluding internal transfers).`,
      };
    }
    return {
      tone: "negative",
      text: `You overspent by ${formatCurrency(Math.abs(net))} this period.`,
    };
  }, [pnl]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-0">
      <AnimatedCard className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reports
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Profit &amp; loss and cashflow use your transactions as the source of
          truth (internal transfers and opening-balance setup are excluded).
        </p>
      </AnimatedCard>

      <AnimatedCard className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Month
            <Input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Year
            <Input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" onClick={loadReports}>
            Refresh
          </Button>
        </div>
      </AnimatedCard>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      {insight && (
        <p
          className={
            insight.tone === "positive"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-200"
          }
        >
          {insight.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedCard className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Profit &amp; loss
          </h3>
          {loading && !pnl ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : pnl ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  Total income
                </dt>
                <dd className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(pnl.totalIncome)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  Total expense
                </dt>
                <dd className="font-semibold text-rose-700 dark:text-rose-300">
                  {formatCurrency(pnl.totalExpense)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                <dt className="font-medium text-slate-800 dark:text-slate-200">
                  Net profit
                </dt>
                <dd className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(pnl.netProfit)}
                </dd>
              </div>
            </dl>
          ) : null}
        </AnimatedCard>

        <AnimatedCard className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Cashflow summary
          </h3>
          {loading && !cashflow ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : cashflow ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Inflow</dt>
                <dd className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(cashflow.inflow)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Outflow</dt>
                <dd className="font-semibold text-rose-700 dark:text-rose-300">
                  {formatCurrency(cashflow.outflow)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                <dt className="font-medium text-slate-800 dark:text-slate-200">
                  Net flow
                </dt>
                <dd className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(cashflow.netFlow)}
                </dd>
              </div>
            </dl>
          ) : null}
        </AnimatedCard>
      </div>

      <AnimatedCard className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Cashflow chart
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Inflow vs outflow for the selected month.
        </p>
        <div className="mt-6 h-72 w-full min-w-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Legend />
                <Bar dataKey="Inflow" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Outflow" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">No data for this period.</p>
          )}
        </div>
      </AnimatedCard>
    </main>
  );
}

export default ReportsPage;
