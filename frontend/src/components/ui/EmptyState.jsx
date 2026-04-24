function EmptyState({
  title = "Nothing here yet",
  description = "",
  icon = "📭",
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/50 px-6 py-10 text-center backdrop-blur-md dark:border-white/15 dark:bg-white/[0.06]">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
