import CountUp from "react-countup";
import { useReducedMotion } from "framer-motion";
import { formatCurrency } from "../../utils/formatters";

const DEFAULT_DURATION = 0.55;

function AnimatedCurrency({
  value,
  className = "",
  duration = DEFAULT_DURATION,
}) {
  const reduceMotion = useReducedMotion();
  const n = Number(value) || 0;

  if (reduceMotion) {
    return (
      <span className={["tabular-nums", className].filter(Boolean).join(" ")}>
        {formatCurrency(n)}
      </span>
    );
  }

  return (
    <span className={["tabular-nums", className].filter(Boolean).join(" ")}>
      <CountUp
        end={n}
        decimals={2}
        duration={duration}
        prefix="Rs "
        preserveValue
        useEasing
      />
    </span>
  );
}

export default AnimatedCurrency;
