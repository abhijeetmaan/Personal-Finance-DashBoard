import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "../animations/variants";
import CategoryPieChart from "../features/dashboard/components/Charts/CategoryPieChart";
import FinanceSummaryCards from "../features/dashboard/components/FinanceSummaryCards";
import InsightsPanel from "../features/dashboard/components/InsightsPanel";
import NetWorthCard from "../features/dashboard/components/NetWorthCard";
import NetWorthChart from "../features/dashboard/components/NetWorthChart";
import TransactionList from "../features/transactions/components/TransactionList";
import Button from "../components/ui/Button";
import { useRealtimeFinanceUpdates } from "../hooks/useRealtimeFinanceUpdates";
import { useToast } from "../components/ui/ToastProvider";
import { budgetService } from "../features/budget/services/budgetService";
import { financeService } from "../features/finance/services/financeService";
import { analyticsService } from "../features/dashboard/services/analyticsService";
import { transactionService } from "../features/transactions/services/transactionService";
import { calculateSummary } from "../features/transactions/utils/transactions";
import { useDateRange } from "../context/DateRangeContext";

function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { budgetMonth, budgetYear, startDate, endDate, comparisonRange } =
    useDateRange();

  const [transactions, setTransactions] = useState([]);
  const [comparisonTransactions, setComparisonTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [categoryChartData, setCategoryChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [netWorth, setNetWorth] = useState(null);
  const [netWorthError, setNetWorthError] = useState("");
  const [netWorthTrend, setNetWorthTrend] = useState(undefined);
  const [netWorthTrendError, setNetWorthTrendError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setNetWorthError("");
    setNetWorthTrendError("");

    try {
      const [
        transactionResult,
        previousTransactionResult,
        budgetResult,
        financeSummaryResult,
        netWorthResult,
        netWorthTrendResult,
      ] = await Promise.allSettled([
        transactionService.getTransactions({
          limit: 100,
          startDate,
          endDate,
        }),
        transactionService.getTransactions({
          limit: 100,
          startDate: comparisonRange.startDate,
          endDate: comparisonRange.endDate,
        }),
        budgetService.getBudget({ month: budgetMonth, year: budgetYear }),
        financeService.getSummary({ month: budgetMonth, year: budgetYear }),
        analyticsService.getNetWorth({ months: 0 }),
        analyticsService.getNetWorthTrend({ months: 12 }),
      ]);

      if (transactionResult.status === "fulfilled") {
        const items = Array.isArray(transactionResult.value?.items)
          ? transactionResult.value.items
          : [];
        setTransactions(items);
      } else {
        throw transactionResult.reason;
      }

      if (previousTransactionResult.status === "fulfilled") {
        const previousItems = Array.isArray(
          previousTransactionResult.value?.items,
        )
          ? previousTransactionResult.value.items
          : [];
        setComparisonTransactions(previousItems);
      } else {
        setComparisonTransactions([]);
      }

      if (budgetResult.status === "fulfilled") {
        setBudget(budgetResult.value);
      } else {
        setBudget(null);
      }

      if (financeSummaryResult.status === "fulfilled") {
        setFinanceSummary(financeSummaryResult.value || null);
      } else {
        setFinanceSummary(null);
      }

      if (netWorthResult.status === "fulfilled") {
        setNetWorth(netWorthResult.value || null);
      } else {
        setNetWorth(null);
        setNetWorthError(
          netWorthResult.reason?.response?.data?.message ||
            "Failed to load net worth.",
        );
      }

      if (netWorthTrendResult.status === "fulfilled") {
        const trend = netWorthTrendResult.value;
        setNetWorthTrend(Array.isArray(trend) ? trend : []);
      } else {
        setNetWorthTrend(undefined);
        setNetWorthTrendError(
          netWorthTrendResult.reason?.response?.data?.message ||
            "Failed to load net worth trend.",
        );
      }
    } catch (loadError) {
      const message =
        loadError?.response?.data?.message || "Failed to load dashboard data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    budgetMonth,
    budgetYear,
    startDate,
    endDate,
    comparisonRange.startDate,
    comparisonRange.endDate,
  ]);

  const insightTransactions = useMemo(
    () => [...comparisonTransactions, ...transactions],
    [comparisonTransactions, transactions],
  );

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => t?.date)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 5);
  }, [transactions]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const dashboardMessage = location.state?.dashboardMessage;
    const refreshToken = location.state?.refreshToken;

    if (!dashboardMessage && !refreshToken) return;

    if (dashboardMessage) {
      showToast(dashboardMessage, "success");
    }
    loadDashboard();

    navigate(location.pathname, { replace: true, state: null });
  }, [loadDashboard, location.pathname, location.state, navigate, showToast]);

  const handleRealtimeTransactionEvent = useCallback(
    (eventName) => {
      setSuccessMessage(
        eventName === "transactionAdded"
          ? "New transaction added."
          : eventName === "transactionUpdated"
            ? "Transaction updated live."
            : "Transaction removed live.",
      );
      loadDashboard();
    },
    [loadDashboard],
  );

  const handleRealtimeBudgetEvent = useCallback(
    (updatedBudget) => {
      if (updatedBudget) {
        setBudget(updatedBudget);
      }
      setSuccessMessage("Budget updated live.");
      loadDashboard();
    },
    [loadDashboard],
  );

  useRealtimeFinanceUpdates({
    onTransactionEvent: handleRealtimeTransactionEvent,
    onBudgetEvent: handleRealtimeBudgetEvent,
  });

  const periodCashflow = useMemo(
    () => calculateSummary(transactions),
    [transactions],
  );

  useEffect(() => {
    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === "expense",
    );

    const categoryMap = new Map();
    expenseTransactions.forEach((transaction) => {
      const category = transaction.category || "Uncategorized";
      const amount = Number(transaction.amount || 0);
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
    });

    setCategoryChartData(
      Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      })),
    );
  }, [transactions]);

  const viewAllButton = (
    <Button
      as={Link}
      to="/transactions"
      variant="secondary"
      size="sm"
      className="!rounded-xl shrink-0"
    >
      View all
    </Button>
  );

  return (
    <main className="flex w-full flex-col gap-6">
      {successMessage ? (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
          className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 backdrop-blur-sm dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {successMessage}
        </motion.p>
      ) : null}

      <section className="p-0" aria-label="Net worth">
        <NetWorthCard
          totalAssets={netWorth?.totalAssets}
          totalLiabilities={netWorth?.totalLiabilities}
          netWorth={netWorth?.netWorth}
          isLoading={isLoading && !netWorth}
          error={netWorthError}
        />
      </section>

      <section className="p-0" aria-label="Key metrics">
        <FinanceSummaryCards
          financeSummary={financeSummary}
          periodIncome={periodCashflow.totalIncome}
          periodExpense={periodCashflow.totalExpenses}
          isLoading={isLoading}
          error={error}
        />
      </section>

      <section className="flex flex-col gap-6 p-0" aria-label="Charts">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <NetWorthChart
            data={netWorthTrend}
            isLoading={
              isLoading && netWorthTrend === undefined && !netWorthTrendError
            }
            error={netWorthTrendError}
          />
          <CategoryPieChart
            data={categoryChartData}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </section>

      <section className="p-0" aria-label="Insights">
        <InsightsPanel
          transactions={insightTransactions}
          budget={budget}
          isLoading={isLoading}
          error={error}
        />
      </section>

      <section className="p-0" aria-label="Recent transactions">
        <TransactionList
          title="Recent transactions"
          transactions={recentTransactions}
          isLoading={isLoading}
          error={error}
          compact
          headerAction={viewAllButton}
          emptyDescription="Add a transaction to see it here."
        />
      </section>
    </main>
  );
}

export default DashboardPage;
