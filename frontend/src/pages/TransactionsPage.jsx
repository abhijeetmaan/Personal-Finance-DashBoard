import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import AddTransactionForm from "../features/transactions/components/AddTransactionForm";
import AnimatedCard from "../components/ui/AnimatedCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/ToastProvider";
import TransactionFilters from "../features/transactions/components/TransactionFilters";
import TransactionList from "../features/transactions/components/TransactionList";
import { useRealtimeFinanceUpdates } from "../hooks/useRealtimeFinanceUpdates";
import { transactionService } from "../features/transactions/services/transactionService";
import { useDateRange } from "../context/DateRangeContext";

const initialFilters = {
  type: "",
  category: "",
  search: "",
  accountId: "",
  cardId: "",
};

function TransactionsPage() {
  const { showToast } = useToast();
  const { startDate, endDate, label } = useDateRange();
  const periodSummary = `${label} · ${startDate} → ${endDate}`;

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionPendingDelete, setTransactionPendingDelete] =
    useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = {
        limit: 100,
        startDate,
        endDate,
      };

      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.cardId) params.cardId = filters.cardId;

      const result = await transactionService.getTransactions(params);
      setTransactions(result.items || []);
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message || "Failed to load transactions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilters(initialFilters);
  };

  const buildExportParams = () => {
    const params = { startDate, endDate };
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.accountId) params.accountId = filters.accountId;
    if (filters.cardId) params.cardId = filters.cardId;
    return params;
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setError("");
    try {
      const blob = await transactionService.exportTransactionsCsv(
        buildExportParams(),
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast("CSV export downloaded", "success");
    } catch (exportError) {
      const msg =
        exportError?.response?.data?.message ||
        "Export failed. Try again or narrow filters.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = (transaction) => {
    setTransactionPendingDelete(transaction);
  };

  const confirmDeleteTransaction = async () => {
    const transaction = transactionPendingDelete;
    if (!transaction) return;

    try {
      await transactionService.deleteTransaction(transaction._id);
      setMessage("Transaction deleted successfully.");
      showToast("Transaction removed", "success");
      if (editingTransaction?._id === transaction._id) {
        setEditingTransaction(null);
      }
      setTransactionPendingDelete(null);
      await loadTransactions();
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message || "Failed to delete transaction.",
      );
      setTransactionPendingDelete(null);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setMessage("");
    setError("");
  };

  const handleUpdate = async (payload) => {
    if (!editingTransaction?._id) {
      setError("No transaction selected for edit.");
      return false;
    }

    try {
      await transactionService.updateTransaction(
        editingTransaction._id,
        payload,
      );
      setMessage("Transaction updated successfully.");
      showToast("Transaction updated", "success");
      setEditingTransaction(null);
      await loadTransactions();
      return true;
    } catch (updateError) {
      setError(
        updateError?.response?.data?.message || "Failed to update transaction.",
      );
      return false;
    }
  };

  const handleRealtimeTransactionEvent = useCallback(
    (eventName) => {
      setMessage(
        eventName === "transactionAdded"
          ? "New transaction added."
          : eventName === "transactionUpdated"
            ? "Transaction updated live."
            : "Transaction removed live.",
      );
      loadTransactions();
    },
    [loadTransactions],
  );

  useRealtimeFinanceUpdates({
    onTransactionEvent: handleRealtimeTransactionEvent,
  });

  return (
    <main className="flex w-full flex-col gap-6">
      <AnimatedCard as="section" className="!p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Transactions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {periodSummary}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2 !rounded-2xl"
            disabled={isExporting || isLoading}
            onClick={handleExportCsv}
          >
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
            {isExporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </AnimatedCard>

      <AnimatedCard as="section" className="!p-6">
        <TransactionFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          hideDateRange
          periodLabel={periodSummary}
        />
      </AnimatedCard>

      {editingTransaction && (
        <AddTransactionForm
          title="Edit Transaction"
          submitLabel="Update Transaction"
          initialValues={editingTransaction}
          onCancel={() => setEditingTransaction(null)}
          onSubmit={handleUpdate}
        />
      )}

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
      <TransactionList
        title="This period"
        transactions={transactions}
        onDelete={handleDelete}
        onEdit={handleEdit}
        isLoading={isLoading}
      />

      <Modal
        isOpen={Boolean(transactionPendingDelete)}
        onClose={() => setTransactionPendingDelete(null)}
        title="Delete transaction"
        description={
          transactionPendingDelete
            ? `Are you sure you want to delete this ${transactionPendingDelete.category} transaction? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDeleteTransaction}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </main>
  );
}

export default TransactionsPage;
