import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  Moon,
  Plus,
  Receipt,
  Sun,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import InstallAppButton from "../components/ui/InstallAppButton";
import DateRangeControl from "../components/date/DateRangeControl";
import NotificationsBell from "./NotificationsBell";
import { useAddTransactionModal } from "../context/AddTransactionModalContext";
import { pageVariants } from "../animations/variants";
import apiClient from "../services/apiClient";

const navItems = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/add", label: "Add Transaction", Icon: Plus, end: false },
  { to: "/transactions", label: "Transactions", Icon: Receipt, end: false },
  { to: "/budget", label: "Budget", Icon: Target, end: false },
  { to: "/reports", label: "Reports", Icon: FileText, end: false },
  { to: "/accounts", label: "Accounts", Icon: Landmark, end: false },
  { to: "/cards", label: "Cards", Icon: CreditCard, end: false },
  { to: "/settings", label: "Settings", Icon: Settings, end: false },
];

const bottomNavItems = [
  { to: "/", label: "Home", Icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Activity", Icon: Receipt, end: false },
  { to: "/budget", label: "Budget", Icon: Target, end: false },
  { to: "/accounts", label: "Accounts", Icon: Landmark, end: false },
  { to: "/cards", label: "Cards", Icon: CreditCard, end: false },
  { to: "/reports", label: "Reports", Icon: FileText, end: false },
  { to: "/settings", label: "Settings", Icon: Settings, end: false },
];

const pageTitleByPath = {
  "/": "Dashboard",
  "/add": "Add Transaction",
  "/accounts": "Accounts",
  "/cards": "Cards",
  "/budget": "Budget",
  "/reports": "Reports",
  "/transactions": "Transactions",
  "/settings": "Settings",
};

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function AppLayout() {
  const location = useLocation();
  const { openAddTransaction } = useAddTransactionModal();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("pfd-theme") || "light",
  );
  const [apiReachable, setApiReachable] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiClient.get("/health", { timeout: 10_000 });
        if (!cancelled) setApiReachable(true);
      } catch {
        if (!cancelled) setApiReachable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pfd-theme", theme);
    window.dispatchEvent(new Event("pfd-theme-change"));
  }, [theme]);

  useEffect(() => {
    const syncFromStorage = () => {
      const next = localStorage.getItem("pfd-theme") || "light";
      setTheme((current) => (current === next ? current : next));
    };
    window.addEventListener("pfd-theme-change", syncFromStorage);
    return () => window.removeEventListener("pfd-theme-change", syncFromStorage);
  }, []);

  const pageTitle = useMemo(
    () => pageTitleByPath[location.pathname] || "Finova",
    [location.pathname],
  );

  const nowLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [],
  );

  const greeting = useMemo(() => greetingForHour(), []);

  return (
    <div
      className={[
        "app-shell flex min-h-screen text-slate-900 dark:text-white",
        apiReachable === false ? "pt-12" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {apiReachable === false && (
        <div
          className="fixed inset-x-0 top-0 z-[60] border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/90 dark:text-amber-100"
          role="alert"
        >
          Cannot reach the API. Confirm{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">
            VITE_API_URL
          </code>{" "}
          on Vercel and that the Render service is running (
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">
            /api/v1/health
          </code>
          ).
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-6 shadow-2xl lg:flex">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-md">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25"
            aria-hidden
          >
            <Wallet className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="bg-gradient-to-r from-blue-200 via-violet-200 to-indigo-200 bg-clip-text text-xl font-semibold leading-tight tracking-tight text-transparent">
              Finova
            </p>
            <p className="mt-1 text-[10px] font-medium leading-snug tracking-wide text-slate-500">
              Track smarter. Spend better.
            </p>
          </div>
        </div>

        <nav
          className="mt-8 flex flex-1 flex-col gap-1.5"
          aria-label="Sidebar Navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-blue-600/30 via-violet-600/25 to-teal-600/20 text-white shadow-lg shadow-blue-900/20 ring-1 ring-white/15"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <item.Icon
                className="h-[18px] w-[18px] shrink-0 opacity-90"
                strokeWidth={2}
                aria-hidden
              />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="relative z-[1] flex min-h-screen flex-1 flex-col pb-24 lg:ml-[260px] lg:pb-6">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/85">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex flex-col">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {greeting}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {pageTitle}
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {nowLabel}
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              <InstallAppButton />
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-100 px-4 py-2 dark:bg-slate-800/90">
                <DateRangeControl variant="toolbar" />
                <NotificationsBell />
                <Link
                  to="/settings"
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-200 dark:hover:bg-slate-600"
                  title="Settings"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-teal-500 text-[10px] font-bold text-white">
                    You
                  </div>
                  <span className="hidden text-xs font-medium text-slate-700 sm:inline dark:text-slate-200">
                    You
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setTheme((prev) => (prev === "light" ? "dark" : "light"))
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-600"
                  aria-pressed={theme === "dark"}
                  title={
                    theme === "light"
                      ? "Switch to dark mode"
                      : "Switch to light mode"
                  }
                >
                  {theme === "light" ? (
                    <Moon className="h-[18px] w-[18px]" strokeWidth={2} />
                  ) : (
                    <Sun className="h-[18px] w-[18px]" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl flex-1 p-6">
          {/*
            Do not use AnimatePresence mode="wait" around <Outlet /> — the outlet
            resolves to the *current* route immediately, so the exiting wrapper
            would animate the wrong page and block the next view (e.g. Settings).
            Keyed motion.div remounts per path and only runs the enter transition.
          */}
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/20 bg-white/85 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 lg:hidden"
        aria-label="Bottom Navigation"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-7 gap-0.5">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[9px] font-semibold transition duration-300 sm:text-[10px]",
                  isActive
                    ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md"
                    : "text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-teal-300",
                ].join(" ")
              }
            >
              <item.Icon
                className="mb-0.5 h-[18px] w-[18px]"
                strokeWidth={2}
                aria-hidden
              />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <motion.button
        type="button"
        aria-label="Add transaction"
        onClick={openAddTransaction}
        className="fixed bottom-[4.25rem] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-violet-500/35 lg:hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 480, damping: 28 }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      </motion.button>

      <motion.button
        type="button"
        aria-label="Add transaction"
        onClick={openAddTransaction}
        className="fixed bottom-8 right-8 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-violet-500/35 lg:flex"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 480, damping: 28 }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      </motion.button>
    </div>
  );
}

export default AppLayout;
