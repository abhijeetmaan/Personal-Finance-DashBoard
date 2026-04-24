import { memo } from "react";
import Card from "../../../components/ui/Card";

function InsightCard({ icon = "💡", title, message, tone = "neutral" }) {
  const toneClasses =
    tone === "positive"
      ? "border-emerald-500/35"
      : tone === "negative"
        ? "border-rose-500/35"
        : "border-sky-500/35";

  return (
    <Card
      as="article"
      className={["!p-5 shadow-md transition-shadow duration-300 hover:shadow-md", toneClasses].join(
        " ",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/[0.06] text-base dark:bg-white/10">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default memo(InsightCard);
