import { memo, useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { generateInsights } from "../utils/insights";
import InsightCard from "./InsightCard";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import { MOTION_DURATION, MOTION_EASE } from "../../../animations/variants";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";

function InsightsPanel({
  transactions,
  budget,
  isLoading = false,
  error = "",
  title = "Insights",
}) {
  const insights = useMemo(
    () => generateInsights(transactions || [], budget),
    [budget, transactions],
  );

  const shell = (children) => (
    <AnimatedCard as="section" className="!p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <Lightbulb
          className="h-5 w-5 text-amber-500/90 dark:text-amber-400/90"
          strokeWidth={2}
          aria-hidden
        />
      </div>
      {children}
    </AnimatedCard>
  );

  if (isLoading) {
    return shell(
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full md:hidden xl:block" />
      </div>,
    );
  }

  if (error) {
    return shell(
      <p className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 backdrop-blur-sm dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </p>,
    );
  }

  if (!insights.length) {
    return shell(
      <EmptyState
        title="No insights yet"
        description="Add a few transactions to see trends and tips here."
        icon="✨"
      />,
    );
  }

  return (
    <AnimatedCard as="section" className="!p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <Lightbulb
          className="h-5 w-5 text-amber-500/90 dark:text-amber-400/90"
          strokeWidth={2}
          aria-hidden
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05,
              duration: MOTION_DURATION,
              ease: MOTION_EASE,
            }}
          >
            <InsightCard
              icon={card.icon}
              title={card.title}
              message={card.message}
              tone={card.tone}
            />
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}

export default memo(InsightsPanel);
