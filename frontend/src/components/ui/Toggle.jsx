import { motion } from "framer-motion";
import { springInteraction } from "../../animations/variants";

function Toggle({
  checked = false,
  onChange,
  disabled = false,
  id,
  "aria-label": ariaLabel = "Toggle",
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={[
        "relative h-7 w-[3.25rem] shrink-0 rounded-full transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
        checked
          ? "bg-blue-500 shadow-inner shadow-blue-900/20 dark:bg-blue-500"
          : "bg-gray-300 dark:bg-slate-600",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <motion.span
        layout
        className="absolute top-1 left-1 block h-5 w-5 rounded-full bg-white shadow-md"
        initial={false}
        animate={{ x: checked ? 22 : 0 }}
        transition={springInteraction}
      />
    </button>
  );
}

export default Toggle;
