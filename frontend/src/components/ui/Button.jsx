import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  scaleHoverButton,
  scaleTap,
  springInteraction,
} from "../../animations/variants";

const MotionLink = motion(Link);

const variantClasses = {
  primary:
    "bg-gradient-to-r from-blue-600 via-violet-600 to-teal-600 text-white shadow-md shadow-blue-500/25 hover:brightness-110 focus:ring-cyan-200 dark:shadow-blue-900/40 dark:focus:ring-cyan-900/40",
  secondary:
    "border border-white/30 bg-white/70 text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/90 focus:ring-slate-200 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 dark:focus:ring-slate-700/40",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20 hover:brightness-110 focus:ring-rose-200 dark:focus:ring-rose-900/40",
};

const hoverGlow = {
  primary:
    "0 10px 28px -6px rgba(99, 102, 241, 0.55), 0 0 0 1px rgba(255,255,255,0.12) inset",
  secondary:
    "0 8px 24px -8px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255,255,255,0.06) inset",
  danger:
    "0 10px 28px -6px rgba(244, 63, 94, 0.45), 0 0 0 1px rgba(255,255,255,0.1) inset",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

function getMotionComponent(as) {
  if (as === Link) return MotionLink;
  if (as === "div") return motion.div;
  if (as === "a") return motion.a;
  return motion.button;
}

function Button({
  children,
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  onPointerDown,
  ...rest
}) {
  const MotionComponent = getMotionComponent(Component);
  const isButton = Component === "button";
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  const addRipple = useCallback(
    (event) => {
      onPointerDown?.(event);
      if (disabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = rippleId.current++;
      setRipples((r) => [...r, { id, x, y }]);
      window.setTimeout(() => {
        setRipples((r) => r.filter((item) => item.id !== id));
      }, 520);
    },
    [disabled, onPointerDown],
  );

  return (
    <MotionComponent
      type={isButton ? type : undefined}
      disabled={isButton ? disabled : undefined}
      whileHover={
        disabled
          ? undefined
          : {
              ...scaleHoverButton,
              boxShadow: hoverGlow[variant] || hoverGlow.primary,
              transition: springInteraction,
            }
      }
      whileTap={
        disabled ? undefined : { ...scaleTap, transition: springInteraction }
      }
      transition={springInteraction}
      onPointerDown={addRipple}
      className={[
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl font-semibold transition duration-300 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ].join(" ")}
      {...rest}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/35"
            style={{
              left: r.x,
              top: r.y,
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
            }}
            initial={{ scale: 0.2, opacity: 0.55 }}
            animate={{ scale: 14, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </AnimatePresence>
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </MotionComponent>
  );
}

export default Button;
