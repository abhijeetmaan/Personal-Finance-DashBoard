import { useEffect, useMemo, useState } from "react";
import { CreditCard, Plus, Trash2, Wallet } from "lucide-react";
import AnimatedCard from "../components/ui/AnimatedCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import Input from "../components/ui/Input";
import ProgressBar from "../components/ui/ProgressBar";
import { useAccounts } from "../hooks/useAccounts";
import { useCards } from "../hooks/useCards";
import { useToast } from "../components/ui/ToastProvider";
import { cardsService } from "../features/cards/services/cardsService";
import {
  formatAccountLabel,
  getCardTypeMeta,
} from "../features/finance/utils/financeCatalog";
import { formatCurrency } from "../utils/formatters";

const createInitialForm = () => ({
  name: "",
  type: "credit",
  limit: "0",
  usedAmount: "0",
  billingCycleStart: 1,
  dueDate: 1,
  linkedAccountId: "",
  icon: "",
});

function CardsPage() {
  const { showToast } = useToast();
  const { accounts, refreshAccounts } = useAccounts();
  const { cards, addCard, payBill, refreshCards, deleteCard, isLoading } =
    useCards();
  const [form, setForm] = useState(createInitialForm);
  const [billSelections, setBillSelections] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [billByCardId, setBillByCardId] = useState({});

  const bankAccounts = useMemo(
    () => accounts.filter((account) => account.type === "bank"),
    [accounts],
  );

  useEffect(() => {
    refreshAccounts();
    refreshCards();
  }, [refreshAccounts, refreshCards]);

  const creditRollup = useMemo(() => {
    const creditCards = cards.filter((card) => card.type === "credit");
    const used = creditCards.reduce(
      (sum, card) => sum + Number(card.usedAmount || 0),
      0,
    );
    const limit = creditCards.reduce(
      (sum, card) => sum + Number(card.limit || 0),
      0,
    );
    const available = Math.max(0, limit - used);
    const utilPct =
      limit > 0 ? Math.round((used / limit) * 10000) / 100 : 0;
    return { used, limit, available, utilPct, count: creditCards.length };
  }, [cards]);

  useEffect(() => {
    let cancelled = false;
    const creditCards = cards.filter((card) => card.type === "credit");

    if (creditCards.length === 0) {
      setBillByCardId({});
      return;
    }

    (async () => {
      const results = await Promise.all(
        creditCards.map(async (card) => {
          try {
            const bill = await cardsService.getCardBill(card._id);
            return [card._id, bill];
          } catch {
            return [card._id, null];
          }
        }),
      );
      if (!cancelled) {
        setBillByCardId(Object.fromEntries(results));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cards]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Card name is required.");
      return;
    }

    try {
      const created = await addCard({
        ...form,
        limit: Number(form.limit || 0),
        usedAmount: Number(form.usedAmount || 0),
        billingCycleStart: Number(form.billingCycleStart || 1),
        dueDate: Number(form.dueDate || 1),
        icon: form.icon?.trim() || "",
      });
      setForm(createInitialForm());
      setMessage(`Added ${created.name}.`);
      showToast(`Card “${created.name}” added`, "success");
      await refreshCards();
    } catch (createError) {
      setError(
        createError?.response?.data?.message ||
          createError?.message ||
          "Failed to create card.",
      );
    }
  };

  const handlePayBill = async (card) => {
    const selectedAccountId = billSelections[card._id] || "";
    const fallbackAccountId =
      card.linkedAccountId?._id || card.linkedAccountId || "";
    const accountId = selectedAccountId || fallbackAccountId;

    if (!accountId) {
      setError("Select account to pay bill.");
      return;
    }

    try {
      await payBill({
        cardId: card._id,
        accountId,
        amount: card.usedAmount,
      });
      setMessage(`Paid bill for ${card.name}.`);
      showToast(`Bill paid — ${card.name}`, "success");
      await refreshAccounts();
      await refreshCards();
    } catch (payError) {
      setError(
        payError?.response?.data?.message ||
          payError?.message ||
          "Failed to pay bill.",
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await deleteCard(pendingDelete._id);
      setMessage("Card deleted successfully.");
      showToast("Card removed", "success");
      setPendingDelete(null);
      await refreshCards();
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message ||
          deleteError?.message ||
          "Failed to delete card.",
      );
      setPendingDelete(null);
    }
  };

  return (
    <main className="flex w-full flex-col gap-6">
      <AnimatedCard className="!p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-teal-500/15 text-violet-600 dark:text-violet-300">
            <CreditCard className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Cards
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Usage, cycles, and payments.
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

      {creditRollup.count > 0 && (
        <AnimatedCard className="!p-6">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Credit overview
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Combined limits and utilization
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Credit used
              </dt>
              <dd className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-300">
                {formatCurrency(creditRollup.used)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Net available
              </dt>
              <dd className="mt-1 text-lg font-bold text-sky-700 dark:text-sky-300">
                {formatCurrency(creditRollup.available)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total limit
              </dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(creditRollup.limit)} · {creditRollup.utilPct}%
                util.
              </dd>
            </div>
          </dl>
          {creditRollup.limit > 0 && creditRollup.utilPct >= 80 && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              High utilization: {creditRollup.utilPct}% of combined credit limit
              in use.
            </p>
          )}
        </AnimatedCard>
      )}

      <AnimatedCard className="!p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Add card
        </h3>

        <form
          className="mt-4 grid gap-4 md:grid-cols-3"
          onSubmit={handleCreate}
        >
          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Name
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="HDFC Credit Card"
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
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Icon (emoji)
            <Input
              name="icon"
              value={form.icon}
              onChange={handleChange}
              placeholder="💳"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Linked Account (optional)
            <select
              name="linkedAccountId"
              value={form.linkedAccountId}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
            >
              <option value="">Select account</option>
              {bankAccounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {formatAccountLabel(account)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Limit
            <Input
              type="number"
              min="0"
              step="0.01"
              name="limit"
              value={form.limit}
              onChange={handleChange}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Billing Cycle Start
            <Input
              type="number"
              min="1"
              max="31"
              name="billingCycleStart"
              value={form.billingCycleStart}
              onChange={handleChange}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            Due Date
            <Input
              type="number"
              min="1"
              max="31"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
            />
          </label>

          <div className="md:col-span-3">
            <Button
              type="submit"
              variant="primary"
              className="inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Add Card
            </Button>
          </div>
        </form>
      </AnimatedCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {isLoading &&
          cards.length === 0 &&
          [0, 1].map((i) => <Skeleton key={i} className="h-64 w-full" />)}

        {cards.map((card) => {
          const meta = getCardTypeMeta(card.type);
          const displayIcon = card.icon?.trim() || meta.icon;
          const usagePercentage =
            typeof card.usagePercentage === "number"
              ? Math.min(100, card.usagePercentage)
              : card.limit > 0
                ? Math.min(100, (card.usedAmount / card.limit) * 100)
                : 0;
          const utilizationPct = Math.round(usagePercentage);
          const dueInDays =
            typeof card.dueInDays === "number"
              ? card.dueInDays
              : null;
          const isCredit = card.type === "credit";
          const linkedAccount = card.linkedAccountId;
          const cycleBill = billByCardId[card._id];

          return (
            <AnimatedCard key={card._id} className="!p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl">{displayIcon}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {card.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Due day: {card.dueDate} · Cycle start:{" "}
                    {card.billingCycleStart}
                    {isCredit && dueInDays !== null && card.usedAmount > 0 && (
                      <>
                        {" "}
                        · Due in {dueInDays} day{dueInDays === 1 ? "" : "s"}
                      </>
                    )}
                  </p>
                </div>

                <Badge variant={isCredit ? "info" : "neutral"}>
                  {card.type}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>
                    {isCredit
                      ? `Used: ${formatCurrency(card.usedAmount)} / ${formatCurrency(card.limit)} · Available: ${formatCurrency(card.available ?? Math.max(0, card.limit - card.usedAmount))}`
                      : `Limit: ${formatCurrency(card.limit)}`}
                  </span>
                  <span>{utilizationPct}% util.</span>
                </div>
                <ProgressBar percentage={usagePercentage} className="mt-2" />

                {isCredit && cycleBill && cycleBill.totalBill > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Current cycle bill:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {formatCurrency(cycleBill.totalBill)}
                    </span>
                  </p>
                )}

                {isCredit && card.dueDateAlert && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-300">
                    {card.dueDateAlert.message}
                  </p>
                )}

                {isCredit && card.highUtilizationWarning && (
                  <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
                    {card.highUtilizationWarning.message}
                  </p>
                )}

                {linkedAccount && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Linked account: {formatAccountLabel(linkedAccount)}
                  </p>
                )}

                {isCredit && card.usedAmount > 0 && !linkedAccount && (
                  <div className="mt-3">
                    <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                      Pay from account
                      <select
                        value={billSelections[card._id] || ""}
                        onChange={(event) =>
                          setBillSelections((current) => ({
                            ...current,
                            [card._id]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
                      >
                        <option value="">Select account to pay bill</option>
                        {bankAccounts.map((account) => (
                          <option key={account._id} value={account._id}>
                            {formatAccountLabel(account)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {isCredit && card.usedAmount > 0 && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handlePayBill(card)}
                    className="inline-flex items-center justify-center gap-1.5"
                  >
                    <Wallet
                      className="h-3.5 w-3.5 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                    Pay Bill
                  </Button>
                )}

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setPendingDelete(card)}
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
          );
        })}

        {!isLoading && cards.length === 0 ? (
          <div className="xl:col-span-2">
            <EmptyState
              title="No cards yet"
              description="Add a credit or debit card to track utilization and due dates."
              icon="💳"
            />
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete card?"
        description="Delete this card permanently. Deletion is blocked if pending balance exists."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}

export default CardsPage;
