import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { springInteraction, toastMotion } from "../../animations/variants";

const TICK_MS = 40;

const gradients = {
  success: "from-emerald-600 via-teal-600 to-emerald-800",
  error: "from-rose-600 via-red-600 to-red-900",
  info: "from-blue-600 via-indigo-600 to-violet-900",
};

function ToastIcon({ type }) {
  const reduceMotion = useReducedMotion();
  const className = "h-6 w-6 shrink-0 text-white drop-shadow-sm";

  if (type === "error") {
    return <XCircle className={className} strokeWidth={2} aria-hidden />;
  }
  if (type === "info") {
    return <Info className={className} strokeWidth={2} aria-hidden />;
  }

  return (
    <motion.span
      initial={reduceMotion ? false : { scale: 0.5, opacity: 0, rotate: -25 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={reduceMotion ? { duration: 0 } : springInteraction}
      className="inline-flex"
      aria-hidden
    >
      <CheckCircle2 className={className} strokeWidth={2} />
    </motion.span>
  );
}

export function Toast({ id, type, title, message, duration, onDismiss }) {
  const pausedRef = useRef(false);
  const leftRef = useRef(duration);
  const [, setPulse] = useState(0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    leftRef.current = duration;
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      leftRef.current -= TICK_MS;
      setPulse((p) => p + 1);
      if (leftRef.current <= 0) {
        clearInterval(iv);
        onDismissRef.current();
      }
    }, TICK_MS);
    return () => clearInterval(iv);
  }, [id, duration]);

  const progressPct = Math.max(
    0,
    Math.min(100, (leftRef.current / duration) * 100),
  );

  const gradient = gradients[type] || gradients.success;

  return (
    <motion.div
      layout
      initial={toastMotion.initial}
      animate={toastMotion.animate}
      exit={toastMotion.exit}
      transition={toastMotion.transition}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.12, right: 0.45 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 72 || info.velocity.x > 380) {
          onDismiss();
        }
      }}
      className="group pointer-events-auto relative w-full min-w-[min(100%,320px)] max-w-md select-none"
      role="status"
      aria-atomic="true"
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div
        className={[
          "relative overflow-hidden rounded-2xl p-4 pr-12 shadow-lg ring-1 ring-white/20 backdrop-blur-lg",
          "bg-gradient-to-br",
          gradient,
        ].join(" ")}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute right-2 top-2 rounded-xl p-2 text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </button>

        <div className="flex gap-3">
          <ToastIcon type={type} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold leading-tight text-white">
              {title}
            </p>
            <p className="mt-1 text-sm font-normal leading-snug text-white/85">
              {message}
            </p>
          </div>
        </div>

        <div
          className="pointer-events-none mt-3 h-1 overflow-hidden rounded-full bg-black/20"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-white/55 shadow-sm"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default Toast;
