const variantClasses = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
};

function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantClasses[variant] || variantClasses.neutral,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default Badge;
