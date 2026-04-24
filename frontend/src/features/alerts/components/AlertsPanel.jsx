import { memo } from "react";
import AlertCard from "./AlertCard";
import AnimatedCard from "../../../components/ui/AnimatedCard";

function AlertsPanel({ alerts = [], isLoading = false, error = "" }) {
  return (
    <AnimatedCard
      as="section"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Smart Alerts
        </h2>
        <span aria-hidden="true">🚨</span>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-700/40 dark:bg-sky-500/10 dark:text-sky-300">
            Loading alerts...
          </p>
        ) : error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No alerts
          </p>
        ) : (
          alerts.map((alert, idx) => (
            <AlertCard key={`${alert.type}-${idx}`} alert={alert} />
          ))
        )}
      </div>
    </AnimatedCard>
  );
}

export default memo(AlertsPanel);
