function ProgressBar({ percentage = 0, className = "" }) {
  const value = Math.min(Math.max(Number(percentage) || 0, 0), 100);
  const barGradient =
    value >= 100
      ? "bg-gradient-to-r from-rose-400 via-rose-500 to-orange-500"
      : value >= 80
        ? "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
        : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500";

  return (
    <div
      className={[
        "h-2.5 overflow-hidden rounded-full bg-slate-200/90 shadow-inner dark:bg-slate-800/80",
        className,
      ].join(" ")}
      aria-label="Progress bar"
    >
      <div
        className={[
          "h-full rounded-full transition-all duration-700 ease-out",
          barGradient,
        ].join(" ")}
        style={{
          width: `${value}%`,
          boxShadow: "0 0 12px rgba(45, 212, 191, 0.35)",
        }}
      />
    </div>
  );
}

export default ProgressBar;
