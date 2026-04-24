import { useState } from "react";
import {
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ProgressBar from "../../../components/ui/ProgressBar";

const getBudgetStatus = ({
  usagePercentage,
  remainingAmount,
  isOverBudget,
}) => {
  const over =
    Boolean(isOverBudget) ||
    usagePercentage > 100 ||
    Number(remainingAmount) < 0;
  if (over) {
    return {
      key: "over",
      label: "Over",
      variant: "danger",
      Icon: ShieldAlert,
    };
  }
  if (usagePercentage >= 70) {
    return {
      key: "warning",
      label: "Warning",
      variant: "warning",
      Icon: TriangleAlert,
    };
  }
  return {
    key: "safe",
    label: "Safe",
    variant: "success",
    Icon: ShieldCheck,
  };
};

function BudgetCard({ budget, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const usagePercentage = Number(
    budget?.percentageUsed ?? budget?.usagePercentage ?? 0,
  );
  const progressPercentage = Number(
    budget?.progressPercentage ?? Math.min(Math.max(usagePercentage, 0), 100),
  );
  const usedAmount = Number(budget?.budgetUsed ?? budget?.usedAmount ?? 0);
  const totalAmount = Number(budget?.monthlyBudget ?? budget?.totalAmount ?? 0);
  const remainingAmount = Number(
    budget?.remaining ?? budget?.remainingAmount ?? 0,
  );
  const status = getBudgetStatus({
    usagePercentage,
    remainingAmount,
    isOverBudget: budget?.isOverBudget,
  });
  const StatusIcon = status.Icon;
  const insight =
    budget?.insight ||
    (status.key === "over"
      ? "Over budget—trim discretionary spend."
      : status.key === "warning"
        ? "Approaching limit—watch discretionary categories."
        : "Spending is within a healthy range.");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextBudget = Number(formData.get("monthlyBudget"));
    if (Number.isNaN(nextBudget) || nextBudget < 0) {
      setError("Enter a valid monthly budget.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await onSave(nextBudget);
      setMessage("Budget updated successfully.");
      event.currentTarget.reset();
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Failed to save budget.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatedCard
      as="section"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Monthly Budget
        </h2>
        <span aria-hidden="true">🎯</span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Budget
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {formatCurrency(totalAmount)}
          </h3>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Used
          </p>
          <h3 className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-300">
            {formatCurrency(usedAmount)}
          </h3>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Remaining
          </p>
          <h3 className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
            {formatCurrency(remainingAmount)}
          </h3>
        </div>
      </div>

      <ProgressBar percentage={progressPercentage} />
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Used {usagePercentage.toFixed(0)}% of budget
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant={status.variant}
          className="inline-flex items-center gap-1.5"
        >
          <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {status.label}
        </Badge>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {insight}
        </span>
      </div>

      {message && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      <form
        className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Set budget
          <Input
            name="monthlyBudget"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter monthly budget"
          />
        </label>
        <Button
          className="inline-flex items-center justify-center gap-2 rounded-xl"
          variant="primary"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin"
                strokeWidth={2}
                aria-hidden
              />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Save Budget
            </>
          )}
        </Button>
      </form>
    </AnimatedCard>
  );
}

export default BudgetCard;
