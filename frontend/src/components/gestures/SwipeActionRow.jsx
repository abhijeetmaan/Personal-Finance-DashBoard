import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { springDragSnap } from "../../animations/variants";

const ACTION_W = 92;

/**
 * Horizontal swipe: right reveals edit, left reveals delete.
 * Uses spring snap; only one row open at a time via `openRowId` / `onOpenChange`.
 */
function SwipeActionRow({
  rowId,
  openRowId,
  onOpenChange,
  onEdit,
  onDelete,
  children,
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);

  const maxRight = onEdit ? ACTION_W : 0;
  const maxLeft = onDelete ? -ACTION_W : 0;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    if (openRowId !== null && openRowId !== rowId) {
      animate(x, 0, springDragSnap);
    }
  }, [openRowId, rowId, x, reduceMotion]);

  const close = () => {
    animate(x, 0, springDragSnap);
    onOpenChange?.(null);
  };

  if (reduceMotion || (!onEdit && !onDelete)) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl [touch-action:pan-y]",
        className,
      ].join(" ")}
    >
      {onEdit ? (
        <div
          className="absolute inset-y-0 left-0 z-0 flex w-[92px] items-stretch bg-emerald-600/95 dark:bg-emerald-600/90"
          aria-hidden
        >
          <button
            type="button"
            aria-label="Edit"
            className="flex flex-1 items-center justify-center text-white transition-opacity hover:opacity-90 active:opacity-80"
            onClick={() => {
              onEdit();
              close();
            }}
          >
            <span className="flex flex-col items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide">
              <Pencil className="h-5 w-5" strokeWidth={2} aria-hidden />
              Edit
            </span>
          </button>
        </div>
      ) : null}

      {onDelete ? (
        <div
          className="absolute inset-y-0 right-0 z-0 flex w-[92px] items-stretch justify-end bg-rose-600/95 dark:bg-rose-600/90"
          aria-hidden
        >
          <button
            type="button"
            aria-label="Delete"
            className="flex flex-1 items-center justify-center text-white transition-opacity hover:opacity-90 active:opacity-80"
            onClick={() => {
              onDelete();
              close();
            }}
          >
            <span className="flex flex-col items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide">
              <Trash2 className="h-5 w-5" strokeWidth={2} aria-hidden />
              Delete
            </span>
          </button>
        </div>
      ) : null}

      <motion.div
        className="relative z-10"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: maxLeft, right: maxRight }}
        dragElastic={{ left: 0.08, right: 0.08 }}
        dragDirectionLock
        dragTransition={{ bounceStiffness: 500, bounceDamping: 28 }}
        onDragStart={() => onOpenChange?.(rowId)}
        onDragEnd={(_, info) => {
          const vx = info.velocity.x;
          const ox = info.offset.x;
          const openL = maxLeft * 0.35;
          const openR = maxRight * 0.35;

          if (onDelete && (ox < openL || vx < -420)) {
            animate(x, maxLeft, springDragSnap);
            onOpenChange?.(rowId);
          } else if (onEdit && (ox > openR || vx > 420)) {
            animate(x, maxRight, springDragSnap);
            onOpenChange?.(rowId);
          } else {
            animate(x, 0, springDragSnap);
            onOpenChange?.(null);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeActionRow;
