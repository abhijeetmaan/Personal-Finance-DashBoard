export const cardBaseClasses =
  "relative isolate overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 shadow-md backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-blue-500/[0.08] before:via-purple-500/[0.06] before:to-teal-500/[0.08] dark:bg-white/10 dark:before:from-blue-400/[0.1] dark:before:via-purple-400/[0.08] dark:before:to-teal-400/[0.1]";

function Card({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={[cardBaseClasses, className].join(" ")} {...props}>
      <div className="relative z-[1]">{children}</div>
    </Component>
  );
}

export default Card;
