import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CreditCard, PiggyBank } from "lucide-react";
import { useDateRange } from "../context/DateRangeContext";
import { alertsService } from "../features/alerts/services/alertsService";
import { budgetService } from "../features/budget/services/budgetService";

function NotificationsBell() {
  const { budgetMonth, budgetYear } = useDateRange();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dynamicAlerts, budgetAlerts] = await Promise.all([
        alertsService.getAlerts({ month: budgetMonth, year: budgetYear }),
        budgetService.getBudgetAlerts({ month: budgetMonth, year: budgetYear }),
      ]);
      const a = Array.isArray(dynamicAlerts) ? dynamicAlerts : [];
      const b = Array.isArray(budgetAlerts) ? budgetAlerts : [];
      const merged = [...b, ...a].map((entry, index) => ({
        id: `${entry.type || "note"}-${index}`,
        message:
          typeof entry === "string"
            ? entry
            : entry.message || entry.title || "Alert",
        type: typeof entry === "object" ? entry.type || "info" : "info",
      }));
      setItems(merged);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [budgetMonth, budgetYear]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (open) load();
    }, 120_000);
    return () => window.clearInterval(t);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const count = items.length;
  const badge = useMemo(() => Math.min(count, 9), [count]);

  return (
    <div className="relative" ref={wrapRef}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-600"
        aria-expanded={open}
        aria-haspopup="true"
        title="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {badge}
            {count > 9 ? "+" : ""}
          </span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            role="menu"
          >
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Alerts
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">
                Budget & cards
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading…
                </p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  You&apos;re all caught up.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const isCard =
                      /card|bill|due|limit/i.test(item.message) ||
                      item.type === "danger";
                    const Icon = isCard ? CreditCard : PiggyBank;
                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 px-4 py-3 text-left"
                      >
                        <span
                          className={[
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                            item.type === "danger"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                          {item.message}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default NotificationsBell;
