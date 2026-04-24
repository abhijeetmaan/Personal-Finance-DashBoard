import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import AnimatedCard from "../../components/ui/AnimatedCard";
import Button from "../../components/ui/Button";
import { accountsService } from "../accounts/services/accountsService";
import { budgetService } from "../budget/services/budgetService";
import { transactionService } from "../transactions/services/transactionService";

const STORAGE_DISMISS = "pfd-onboarding-dismissed-v1";

function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_DISMISS) === "1",
  );
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [hasTransaction, setHasTransaction] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getUTCMonth() + 1;
      const year = now.getUTCFullYear();

      const [accounts, txData, budget] = await Promise.all([
        accountsService.getAccounts(),
        transactionService.getTransactions({ limit: 1, page: 1 }),
        budgetService.getBudget({ month, year }).catch(() => null),
      ]);

      setHasAccount(Array.isArray(accounts) && accounts.length > 0);
      setHasTransaction(
        Array.isArray(txData?.items) && txData.items.length > 0,
      );

      const totalBudget = Number(
        budget?.totalBudget ??
          budget?.monthlyBudget ??
          budget?.totalAmount ??
          0,
      );
      const categoryBudgets = budget?.categories || [];
      const hasCategoryBudgets = categoryBudgets.some(
        (c) => Number(c?.budget ?? c?.monthlyBudget ?? 0) > 0,
      );
      setHasBudget(totalBudget > 0 || hasCategoryBudgets);
    } catch {
      setHasAccount(false);
      setHasTransaction(false);
      setHasBudget(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allDone = hasAccount && hasTransaction && hasBudget;

  useEffect(() => {
    if (allDone && !dismissed) {
      localStorage.setItem(STORAGE_DISMISS, "1");
      setDismissed(true);
    }
  }, [allDone, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_DISMISS, "1");
    setDismissed(true);
  };

  if (dismissed || loading) {
    return null;
  }

  const steps = [
    {
      done: hasAccount,
      title: "Add an account",
      hint: "Connect where your money lives (bank, wallet, etc.).",
      to: "/accounts",
      cta: "Add account",
    },
    {
      done: hasTransaction,
      title: "Record a transaction",
      hint: "Income or expense—your ledger stays the source of truth.",
      to: "/add",
      cta: "Add transaction",
    },
    {
      done: hasBudget,
      title: "Set a budget",
      hint: "Pick a monthly target so we can alert you early.",
      to: "/budget",
      cta: "Open budget",
    },
  ];

  return (
    <AnimatedCard as="section" className="!border-violet-400/30 !p-6 ring-1 ring-violet-500/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
            <Rocket className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome — finish setup
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Three quick steps to get investor-ready clarity on your finances.
            </p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleDismiss}>
          Dismiss
        </Button>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.title}
            className="flex flex-col rounded-2xl border border-white/30 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-2">
              {step.done ? (
                <CheckCircle2
                  className="h-5 w-5 text-emerald-500"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Circle
                  className="h-5 w-5 text-slate-300 dark:text-slate-600"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              <span className="font-semibold text-slate-900 dark:text-white">
                {step.title}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm text-gray-500 dark:text-gray-400">
              {step.hint}
            </p>
            {!step.done ? (
              <Button
                as={Link}
                to={step.to}
                variant="primary"
                size="sm"
                className="mt-3 w-full justify-center"
              >
                {step.cta}
              </Button>
            ) : (
              <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Done
              </p>
            )}
          </li>
        ))}
      </ul>
    </AnimatedCard>
  );
}

export default OnboardingChecklist;
