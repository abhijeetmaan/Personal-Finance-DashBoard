import { motion } from "framer-motion";
import Input from "../ui/Input";
import { useDateRange } from "../../context/DateRangeContext";

const pillBase =
  "rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";

function DateRangeControl({ variant = "default" }) {
  const {
    preset,
    setPreset,
    label,
    startDate,
    endDate,
    customStart,
    customEnd,
    setCustomRange,
  } = useDateRange();

  const isToolbar = variant === "toolbar";

  const pills = (
    <div className="flex flex-wrap items-center gap-1.5">
      {[
        { id: "this_month", text: "This month" },
        { id: "last_month", text: "Last month" },
        { id: "custom", text: "Custom" },
      ].map((item) => (
        <motion.button
          key={item.id}
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setPreset(item.id)}
          className={[
            pillBase,
            preset === item.id
              ? "bg-blue-500 text-white shadow-sm dark:bg-blue-500 dark:text-white"
              : "bg-gray-200 text-slate-700 hover:bg-gray-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500",
          ].join(" ")}
        >
          {item.text}
        </motion.button>
      ))}
    </div>
  );

  if (isToolbar) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        {pills}
        {preset === "custom" ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              From
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomRange(e.target.value, customEnd)}
                className="!py-1 !text-xs"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              To
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomRange(customStart, e.target.value)}
                className="!py-1 !text-xs"
              />
            </label>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-0">
      <div className="flex flex-wrap items-center gap-2">{pills}</div>

      {preset === "custom" ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            From
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomRange(e.target.value, customEnd)}
              className="!py-1.5 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            To
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomRange(customStart, e.target.value)}
              className="!py-1.5 text-xs"
            />
          </label>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </span>
          <span className="mx-1.5">·</span>
          {startDate} → {endDate}
        </p>
      )}
    </div>
  );
}

export default DateRangeControl;
