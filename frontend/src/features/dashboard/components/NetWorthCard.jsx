import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CreditCard, HelpCircle, Landmark } from "lucide-react";
import AnimatedCurrency from "../../../components/ui/AnimatedCurrency";
import Skeleton from "../../../components/ui/Skeleton";
import { formatCurrency } from "../../../utils/formatters";
import {
  MOTION_DURATION,
  MOTION_EASE,
  scaleHover,
  springInteraction,
} from "../../../animations/variants";

const TOOLTIP_HINT = "Assets minus liabilities";

function NetWorthShine() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute -left-[40%] top-0 h-full w-[45%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-20%" }}
        animate={{ x: "320%" }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 2.5,
        }}
      />
    </div>
  );
}

function StatPill({ Icon, label, value, tint }) {
  const tintClasses =
    tint === "green"
      ? "border-emerald-300/35 bg-emerald-500/12 text-emerald-50 ring-1 ring-emerald-300/20"
      : "border-rose-300/35 bg-rose-500/12 text-rose-50 ring-1 ring-rose-300/20";

  return (
    <div
      className={[
        "flex items-center justify-center gap-3 rounded-xl px-4 py-3 backdrop-blur-md",
        tintClasses,
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      <p className="text-base font-semibold tabular-nums text-white">
        <span className="sr-only">{label}: </span>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function NetWorthCard({
  netWorth = 0,
  assets,
  liabilities,
  totalAssets = 0,
  totalLiabilities = 0,
  isLoading = false,
  error = "",
}) {
  const hintId = useId();
  const assetsVal = assets ?? totalAssets ?? 0;
  const liabilitiesVal = liabilities ?? totalLiabilities ?? 0;
  const netVal = Number(netWorth ?? 0);
  const positive = netVal >= 0;
  const reduceMotion = useReducedMotion();

  const glowRing = positive
    ? "ring-2 ring-emerald-400/35 ring-offset-2 ring-offset-transparent"
    : "ring-2 ring-rose-400/35 ring-offset-2 ring-offset-transparent";

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
      whileHover={
        reduceMotion
          ? undefined
          : { ...scaleHover, transition: springInteraction }
      }
      className={[
        "relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6 text-white shadow-xl sm:p-8",
        "shadow-[0_25px_50px_-12px_rgba(79,70,229,0.45),0_0_80px_-20px_rgba(139,92,246,0.35)]",
        glowRing,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-white/10 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl"
        aria-hidden
      />

      <NetWorthShine />

      <div className="relative z-[3] mx-auto max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2">
          <Landmark className="h-5 w-5 text-white/90" strokeWidth={2} aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide text-white/95">
            Net Worth
          </h2>
          <span
            className="inline-flex rounded-full bg-black/15 p-1 text-white/90 backdrop-blur-sm"
            title={TOOLTIP_HINT}
          >
            <HelpCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <span className="sr-only" id={`${hintId}-desc`}>
              {TOOLTIP_HINT}
            </span>
          </span>
        </div>

        {error ? (
          <p
            className="mt-6 rounded-xl border border-white/25 bg-rose-500/20 px-4 py-3 text-sm text-white"
            role="alert"
          >
            {error}
          </p>
        ) : isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="mx-auto h-14 w-56 rounded-xl bg-white/20" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-[4.25rem] rounded-xl bg-white/15" />
              <Skeleton className="h-[4.25rem] rounded-xl bg-white/15" />
            </div>
          </div>
        ) : (
          <>
            <p
              className="mt-6 text-4xl font-bold tabular-nums tracking-tight text-white drop-shadow-md sm:text-5xl"
              aria-describedby={`${hintId}-desc`}
            >
              <AnimatedCurrency value={netVal} />
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatPill Icon={Landmark} label="Assets" value={assetsVal} tint="green" />
              <StatPill
                Icon={CreditCard}
                label="Liabilities"
                value={liabilitiesVal}
                tint="red"
              />
            </div>
          </>
        )}
      </div>
    </motion.article>
  );
}

export default NetWorthCard;
