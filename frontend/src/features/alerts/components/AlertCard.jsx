import { memo } from "react";
import { formatDateTime } from "../../../utils/formatters";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import Badge from "../../../components/ui/Badge";

function AlertCard({ alert }) {
  const normalizedType =
    alert?.type === "danger"
      ? "danger"
      : alert?.type === "warning"
        ? "warning"
        : "info";
  const toneClasses =
    normalizedType === "danger"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-500/10 dark:text-red-300"
      : normalizedType === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-500/10 dark:text-amber-300"
        : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-500/10 dark:text-sky-300";

  return (
    <AnimatedCard
      as="article"
      className={`rounded-2xl border px-4 py-4 shadow-sm transition duration-300 hover:shadow-md ${toneClasses}`}
    >
      <div className="mb-2">
        <Badge variant={normalizedType}>{normalizedType.toUpperCase()}</Badge>
      </div>
      <p className="text-sm font-medium leading-6">
        {alert?.message || "No alert message"}
      </p>
      {alert?.createdAt && (
        <p className="mt-2 text-xs opacity-80">
          {formatDateTime(alert.createdAt)}
        </p>
      )}
    </AnimatedCard>
  );
}

export default memo(AlertCard);
