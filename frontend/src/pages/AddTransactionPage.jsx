import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddTransactionForm from "../features/transactions/components/AddTransactionForm";
import AnimatedCard from "../components/ui/AnimatedCard";
import { transactionService } from "../features/transactions/services/transactionService";

function AddTransactionPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleAddTransaction = async (payload) => {
    try {
      await transactionService.createTransaction(payload);
      setStatus({
        type: "success",
        message: "Transaction added successfully.",
      });
      navigate("/", {
        replace: false,
        state: {
          dashboardMessage: "Transaction added successfully.",
          refreshToken: Date.now(),
        },
      });
      return true;
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "Failed to add transaction.",
      });
      return false;
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-0">
      <AnimatedCard
        as="section"
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Add New Transaction
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create income or expense entries and keep your dashboard up to date.
        </p>
      </AnimatedCard>

      {status.message && (
        <p
          className={[
            "rounded-xl px-4 py-3 text-sm",
            status.type === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300",
          ].join(" ")}
        >
          {status.message}
        </p>
      )}

      <AddTransactionForm onSubmit={handleAddTransaction} />
    </main>
  );
}

export default AddTransactionPage;
