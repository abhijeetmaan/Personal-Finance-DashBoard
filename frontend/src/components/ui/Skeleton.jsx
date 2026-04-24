const roundedClass = {
  none: "",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

function Skeleton({ className = "", rounded = "2xl" }) {
  return (
    <div
      className={[
        "animate-pulse bg-slate-200/80 dark:bg-white/10",
        roundedClass[rounded] || roundedClass["2xl"],
        className,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
