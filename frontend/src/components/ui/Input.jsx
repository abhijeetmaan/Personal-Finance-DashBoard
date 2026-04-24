import { useId } from "react";

const inputBase =
  "w-full rounded-xl border-2 border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-out placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]";

function Input({ className = "", ...props }) {
  return (
    <input
      className={[inputBase, className].join(" ")}
      {...props}
    />
  );
}

/**
 * Floating label — use with `placeholder=" "` (space) so :placeholder-shown works.
 */
export function TextField({
  label,
  id: idProp,
  className = "",
  inputClassName = "",
  onFocus,
  onBlur,
  ...props
}) {
  const genId = useId();
  const id = idProp || genId;

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <Input
        id={id}
        placeholder=" "
        className={["peer pt-5 pb-2", inputClassName].join(" ")}
        onFocus={(e) => onFocus?.(e)}
        onBlur={(e) => onBlur?.(e)}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 origin-left text-sm text-slate-500 transition-all duration-200 ease-out peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-violet-600 dark:text-slate-400 dark:peer-focus:text-violet-400 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-violet-600 dark:peer-[:not(:placeholder-shown)]:text-violet-400"
      >
        {label}
      </label>
    </div>
  );
}

export default Input;
