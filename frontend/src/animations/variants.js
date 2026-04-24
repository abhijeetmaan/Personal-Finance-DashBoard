/**
 * Global animation tokens — subtle, fast (0.2–0.4s), product motion.
 */

export const MOTION_EASE = [0.22, 1, 0.36, 1];

/** 0.2–0.4s band */
export const MOTION_DURATION = 0.25;
export const MOTION_DURATION_PAGE = 0.3;
export const MOTION_DURATION_QUICK = 0.2;

/** Shared spring for hovers / taps (user spec: stiffness 200) */
export const springInteraction = {
  type: "spring",
  stiffness: 200,
  damping: 24,
};

/** Swipe row snap — quick, no overshoot */
export const springDragSnap = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.55,
};

/** Reorder lists — responsive drag follow-through */
export const springReorder = {
  type: "spring",
  stiffness: 360,
  damping: 30,
  mass: 0.7,
};

export const transition = {
  tweenFast: {
    duration: MOTION_DURATION_QUICK,
    ease: MOTION_EASE,
  },
  tween: {
    duration: MOTION_DURATION,
    ease: MOTION_EASE,
  },
  /** Buttons */
  button: springInteraction,
};

/** Fade + slide up (cards, sections) */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

/** Simple fade */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Card / interactive surface hover */
export const scaleHover = {
  scale: 1.02,
};

/** Primary buttons — slightly stronger hover */
export const scaleHoverButton = {
  scale: 1.03,
};

export const scaleTap = {
  scale: 0.96,
};

/**
 * Route outlet — 0.3s enter (use with initial="initial" animate="animate" exit="exit")
 */
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION_PAGE,
      ease: MOTION_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: {
      duration: MOTION_DURATION_QUICK,
      ease: MOTION_EASE,
    },
  },
};

export const pageTransition = pageVariants;

/** Modal */
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION_DURATION_QUICK, ease: MOTION_EASE },
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: MOTION_DURATION, ease: MOTION_EASE },
};

/** Toast */
export const toastMotion = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0 },
  exit: {
    opacity: 0,
    x: 28,
    transition: { duration: MOTION_DURATION_QUICK, ease: MOTION_EASE },
  },
  transition: {
    duration: MOTION_DURATION,
    ease: MOTION_EASE,
  },
};

/** Lists */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION,
      ease: MOTION_EASE,
    },
  },
};

/** Card mount preset */
export const cardEnterTransition = {
  duration: MOTION_DURATION_QUICK,
  ease: MOTION_EASE,
};
