import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Download,
  Landmark,
  Moon,
  Receipt,
  Settings,
  Tags,
} from "lucide-react";
import AnimatedCard from "../components/ui/AnimatedCard";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";

const sections = [
  {
    title: "Accounts",
    description: "Balances from your ledger.",
    to: "/accounts",
    Icon: Landmark,
    action: "Accounts",
  },
  {
    title: "Cards",
    description: "Limits, utilization, bills.",
    to: "/cards",
    Icon: CreditCard,
    action: "Cards",
  },
  {
    title: "Categories & budgets",
    description: "Catalog, budgets, alerts.",
    to: "/budget",
    Icon: Tags,
    action: "Budget",
  },
  {
    title: "Transactions",
    description: "History and CSV export.",
    to: "/transactions",
    Icon: Receipt,
    action: "Transactions",
  },
];

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("pfd-theme") === "dark",
  );

  useEffect(() => {
    const sync = () =>
      setDarkMode(localStorage.getItem("pfd-theme") === "dark");
    window.addEventListener("pfd-theme-change", sync);
    return () => window.removeEventListener("pfd-theme-change", sync);
  }, []);

  const handleDarkToggle = (checked) => {
    setDarkMode(checked);
    const v = checked ? "dark" : "light";
    localStorage.setItem("pfd-theme", v);
    document.documentElement.classList.toggle("dark", checked);
    window.dispatchEvent(new Event("pfd-theme-change"));
  };

  return (
    <main className="w-full space-y-6">
      <AnimatedCard as="section" className="!p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Appearance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                System-wide theme
              </p>
            </div>
          </div>
          <Toggle
            checked={darkMode}
            onChange={handleDarkToggle}
            aria-label="Dark mode"
          />
        </div>
      </AnimatedCard>

      <AnimatedCard as="header" className="!p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg dark:from-slate-600 dark:to-slate-800">
              <Settings className="h-6 w-6" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Shortcuts and export.
              </p>
            </div>
          </div>
          <Button as={Link} to="/transactions" variant="secondary" className="gap-2">
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
            Export CSV
          </Button>
        </div>
      </AnimatedCard>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((item) => (
          <AnimatedCard key={item.to} as="section" className="!p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-teal-500/15 text-blue-700 dark:text-blue-300">
                <item.Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
                <Button
                  as={Link}
                  to={item.to}
                  variant="primary"
                  size="sm"
                  className="mt-4"
                >
                  {item.action}
                </Button>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </main>
  );
}

export default SettingsPage;
