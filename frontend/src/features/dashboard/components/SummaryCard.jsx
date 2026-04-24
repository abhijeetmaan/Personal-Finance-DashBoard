import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedCurrency from "../../../components/ui/AnimatedCurrency";
import { formatCurrency } from "../../../utils/formatters";
import {
  MOTION_DURATION,
  MOTION_EASE,
  scaleHover,
  springInteraction,
} from "../../../animations/variants";

function SummaryCard({
  icon: Icon,
  title,
  subtitle = "",
  amount,
  tone = "default",
  isLoading = false,
  variant = "default",
}) {
  const reduceMotion = useReducedMotion();
  const isFintech = variant === "fintech";

  const fintechShell =
    tone === "income"
      ? "border-slate-200/90 bg-white shadow-md ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:bg-slate-900/50 dark:ring-white/10"
      : tone === "expense"
        ? "border-slate-200/90 bg-white shadow-md ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:bg-slate-900/50 dark:ring-white/10"
        : tone === "credit"
          ? "border-slate-200/90 bg-white shadow-md ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:bg-slate-900/50 dark:ring-white/10"
          : "border-slate-200/90 bg-white shadow-md ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:bg-slate-900/50 dark:ring-white/10";

  const shellTone = isFintech
    ? fintechShell
    : tone === "income"
      ? "border-emerald-200/50 bg-gradient-to-br from-emerald-500/[0.07] via-teal-500/[0.05] to-transparent dark:border-emerald-500/20 dark:from-emerald-400/10"
      : tone === "expense"
        ? "border-rose-200/50 bg-gradient-to-br from-rose-500/[0.08] via-orange-500/[0.05] to-transparent dark:border-rose-500/20 dark:from-rose-400/10"
        : tone === "balance"
          ? "border-blue-200/50 bg-gradient-to-br from-blue-500/[0.07] via-violet-500/[0.06] to-teal-500/[0.05] dark:border-white/15 dark:from-blue-400/10"
          : "border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-white/5";

  const valueClass = isFintech
    ? tone === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "expense"
        ? "text-rose-600 dark:text-rose-400"
        : tone === "credit"
          ? "text-amber-600 dark:text-amber-400"
          : "text-slate-900 dark:text-white"
    : tone === "income"
      ? "bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-300"
      : tone === "expense"
        ? "bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent dark:from-rose-300 dark:to-orange-300"
        : tone === "balance"
          ? "bg-gradient-to-r from-blue-600 via-violet-600 to-teal-600 bg-clip-text text-transparent dark:from-blue-300 dark:via-violet-300 dark:to-teal-300"
          : "text-slate-900 dark:text-white";

  const iconWrapClass = isFintech
    ? tone === "income"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
      : tone === "expense"
        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
        : tone === "credit"
          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
    : tone === "income"
      ? "from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-200"
      : tone === "expense"
        ? "from-rose-500/20 to-orange-500/20 text-rose-700 dark:text-rose-200"
        : tone === "balance"
          ? "from-blue-500/20 to-violet-500/20 text-violet-700 dark:text-violet-200"
          : "from-slate-500/15 to-slate-600/15 text-slate-700 dark:text-slate-200";

  const isMetric = variant === "metric";
  const useAnimatedAmount = isMetric || isFintech;

  const hoverClass = isFintech
    ? "hover:shadow-lg"
    : "";

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
      whileHover={
        reduceMotion
          ? undefined
          : { ...scaleHover, transition: springInteraction }
      }
      className={[
        "relative overflow-hidden rounded-2xl border p-5 transition-shadow duration-300",
        isFintech ? `${hoverClass} backdrop-blur-sm` : "backdrop-blur-md",
        shellTone,
      ].join(" ")}
    >
      {isFintech ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon ? (
              <div
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  iconWrapClass,
                ].join(" ")}
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
            ) : null}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {title}
              </p>
              {subtitle ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <span className="sr-only">{title}</span>

          {isMetric ? (
            <div className="flex items-start justify-between gap-3">
              {Icon ? (
                <div
                  className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner ring-1 ring-white/30 dark:ring-white/10",
                    iconWrapClass,
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {title}
                </p>
                {subtitle ? (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {Icon ? (
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner ring-1 ring-white/30 dark:ring-white/10",
                    iconWrapClass,
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      <h3
        className={[
          isFintech ? "mt-4" : isMetric ? "mt-4" : "mt-4",
          "text-xl font-semibold tabular-nums tracking-tight",
          valueClass,
        ].join(" ")}
      >
        {isLoading ? (
          <span className="inline-flex h-8 w-32 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/20" />
        ) : useAnimatedAmount ? (
          <AnimatedCurrency value={amount} />
        ) : (
          formatCurrency(amount)
        )}
      </h3>
    </motion.article>
  );
}

export default memo(SummaryCard);
