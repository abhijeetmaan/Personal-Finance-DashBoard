import { motion, useReducedMotion } from "framer-motion";
import { cardBaseClasses } from "./Card";
import {
  MOTION_DURATION_QUICK,
  MOTION_EASE,
  fadeInUp,
  scaleHover,
  springInteraction,
} from "../../animations/variants";

const hoverShadow =
  "0 22px 44px -12px rgba(59, 130, 246, 0.2), 0 12px 28px -10px rgba(139, 92, 246, 0.16), 0 0 36px -12px rgba(99, 102, 241, 0.12)";

const idleShadow =
  "0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)";

function AnimatedCard({ as = "div", className = "", children, ...props }) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motion[as] || motion.div;

  return (
    <MotionComponent
      initial={reduceMotion ? false : fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: MOTION_DURATION_QUICK,
              ease: MOTION_EASE,
            }
      }
      whileHover={
        reduceMotion
          ? undefined
          : {
              ...scaleHover,
              boxShadow: hoverShadow,
              transition: springInteraction,
            }
      }
      style={{ boxShadow: idleShadow }}
      className={[cardBaseClasses, className].join(" ")}
      {...props}
    >
      <div className="relative z-[1]">{children}</div>
    </MotionComponent>
  );
}

export default AnimatedCard;
