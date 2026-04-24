import { useEffect, useState } from "react";
import { Reorder } from "framer-motion";
import { ArrowLeftRight, Landmark, Plus, Trash2 } from "lucide-react";
import { springReorder } from "../animations/variants";
import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../components/ui/ToastProvider";
import { accountsService } from "../features/accounts/services/accountsService";
import { analyticsService } from "../features/dashboard/services/analyticsService";
import { useAccounts } from "../hooks/useAccounts";
import { getAccountTypeMeta } from "../features/finance/utils/financeCatalog";
import { formatCurrency } from "../utils/formatters";

const initialForm = {
  name: "",
  type: "bank",
  balance: "0",
  currency: "INR",
  color: "",
  icon: "",
};

const LOW_BALANCE_THRESHOLD = 5000;

function AccountsPage() {
  const { showToast } = useToast();
  const {
    accounts,
    isLoading,
    addAccount,
    refreshAccounts,
    deleteAccount,
    reorderAccounts,
  } = useAccounts();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [summary, setSummary] = useState(null);
  const [netBalance, setNetBalance] = useState(null);
  const [transfer, setTransfer] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [summaryData, netData] = await Promise.all([
          accountsService.getSummary({
            lowBalanceThreshold: LOW_BALANCE_THRESHOLD,
          }),
          analyticsService.getNetBalance(),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setNetBalance(netData);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
          setNetBalance(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accounts.length]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Account name is required.");
      return;
    }

    try {
      const addedName = form.name.trim();
      await addAccount({
        ...form,
        balance: Number(form.balance || 0),
        currency: form.currency || "INR",
        color: form.color?.trim() || "",
        icon: form.icon?.trim() || "",
      });
      setForm(initialForm);
      setMessage(`Added ${addedName}.`);
      showToast(`Account “${addedName}” added`, "success");
      await refreshAccounts();
    } catch (createError) {
      setError(
        createError?.response?.data?.message ||
          createError?.message ||
          "Failed to create account.",
      );
    }
  };

  const handleTransferChange = (event) => {
    const { name, value } = event.target;
    setTransfer((current) => ({ ...current, [name]: value }));
  };

  const handleTransfer = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!transfer.fromAccountId || !transfer.toAccountId) {
      setError("Select both source and destination accounts.");
      return;
    }

    const amt = Number(transfer.amount);
    if (!transfer.amount?.toString().trim() || Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid transfer amount.");
      return;
    }

    try {
      await accountsService.transfer({
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount: amt,
        notes: transfer.notes?.trim() || "",
      });
      setMessage("Transfer completed.");
      showToast("Transfer completed", "success");
      setTransfer({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        notes: "",
      });
      await refreshAccounts();
      const [summaryData, netData] = await Promise.all([
        accountsService.getSummary({
          lowBalanceThreshold: LOW_BALANCE_THRESHOLD,
        }),
        analyticsService.getNetBalance(),
      ]);
      setSummary(summaryData);
      setNetBalance(netData);
    } catch (transferError) {
      setError(
        transferError?.response?.data?.message ||
          transferError?.message ||
          "Transfer failed.",
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    try {
      await deleteAccount(pendingDelete._id);
      setMessage("Account deleted successfully.");
      showToast("Account removed", "success");
      setPendingDelete(null);
      await refreshAccounts();
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message ||
          deleteError?.message ||
          "Failed to delete account.",
      );
      setPendingDelete(null);
    }
  };

  return (
    <main className="flex w-full flex-col gap-6">
      <AnimatedCard className="!p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-violet-600 dark:text-violet-300">
            <Landmark className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Accounts
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cash and investments in one view.
            </p>
          </div>
        </div>
      </AnimatedCard>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </p>
      )}

      {summary?.lowBalanceWarning && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-200">
          Low balance warning: {summary.lowBalanceWarning.message}
        </p>
      )}

      {netBalance && (
        <AnimatedCard className="!p-6">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Net position
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cash minus credit drawn (same as analytics).
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Accounts
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(netBalance.totalAccountsBalance)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Credit used
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(netBalance.totalCreditUsed)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Net available
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-cyan-700 dark:text-cyan-300">
                {formatCurrency(netBalance.netAvailable)}
              </dd>
            </div>
          </dl>
        </AnimatedCard>
      )}

      <AnimatedCard className="!p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Add account
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Opening balance is a one-time seed; updates come from transactions.
        </p>
        <form
          className="mt-4 grid gap-4 md:grid-cols-3"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Name
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="SBI Bank"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
            >
              <option value="bank">Bank</option>
              <option value="wallet">Wallet</option>
              <option value="investment">Investment</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Opening balance (optional seed)
            <Input
              type="number"
              min="0"
              step="0.01"
              name="balance"
              value={form.balance}
              onChange={handleChange}
            />
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              Stored as a single “Other” transaction—not a manual balance field.
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Currency
            <Input
              name="currency"
              value={form.currency}
              onChange={handleChange}
              placeholder="INR"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Card color (hex)
            <Input
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="#0ea5e9"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Icon (emoji)
            <Input
              name="icon"
              value={form.icon}
              onChange={handleChange}
              placeholder="🏦"
            />
          </label>
          <div className="md:col-span-3">
            <Button
              type="submit"
              variant="primary"
              className="inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Add Account
            </Button>
          </div>
        </form>
      </AnimatedCard>

      <AnimatedCard className="!p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Transfer
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Matched expense and income to keep balances correct.
        </p>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={handleTransfer}
        >
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            From
            <select
              name="fromAccountId"
              value={transfer.fromAccountId}
              onChange={handleTransferChange}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            To
            <select
              name="toAccountId"
              value={transfer.toAccountId}
              onChange={handleTransferChange}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Amount
            <Input
              type="number"
              min="0"
              step="0.01"
              name="amount"
              value={transfer.amount}
              onChange={handleTransferChange}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
            Notes (optional)
            <Input
              name="notes"
              value={transfer.notes}
              onChange={handleTransferChange}
              placeholder="Rent share, savings move…"
            />
          </label>
          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="secondary"
              className="inline-flex items-center justify-center gap-2"
            >
              <ArrowLeftRight
                className="h-4 w-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              Transfer
            </Button>
          </div>
        </form>
      </AnimatedCard>

      <section aria-label="Your accounts" className="flex flex-col gap-3">
        {isLoading && accounts.length === 0 ? (
          <div className="flex flex-col gap-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : null}

        {accounts.length > 0 ? (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag to reorder · order saved on this device
            </p>
            <Reorder.Group
            axis="y"
            values={accounts}
            onReorder={reorderAccounts}
            className="flex flex-col gap-6"
          >
            {accounts.map((account) => {
              const meta = getAccountTypeMeta(account.type);
              const displayIcon = account.icon?.trim() || meta.icon;
              const accent = account.color?.trim();
              return (
                <Reorder.Item
                  key={account._id}
                  value={account}
                  transition={springReorder}
                  className="relative cursor-grab list-none active:cursor-grabbing"
                  whileDrag={{
                    scale: 1.008,
                    boxShadow:
                      "0 20px 40px -20px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.2)",
                    zIndex: 2,
                  }}
                >
                  <AnimatedCard
                    className="!p-6"
                    style={
                      accent
                        ? { borderLeftWidth: 4, borderLeftColor: accent }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl">{displayIcon}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                          {account.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {meta.label}
                          {account.currency && account.currency !== "INR"
                            ? ` · ${account.currency}`
                            : ""}
                        </p>
                      </div>
                      <Badge variant="info">{account.type}</Badge>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(account.balance)}
                    </p>
                    {Number(account.balance) < LOW_BALANCE_THRESHOLD && (
                      <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                        Low balance — under{" "}
                        {formatCurrency(LOW_BALANCE_THRESHOLD)}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setPendingDelete(account)}
                        className="inline-flex items-center justify-center gap-1.5"
                      >
                        <Trash2
                          className="h-3.5 w-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                        Delete
                      </Button>
                    </div>
                  </AnimatedCard>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          </>
        ) : null}

        {!isLoading && accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Add a bank, wallet, or investment account to start tracking balances."
            icon="🏦"
          />
        ) : null}
      </section>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete account?"
        description="Delete this account permanently."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}

export default AccountsPage;
