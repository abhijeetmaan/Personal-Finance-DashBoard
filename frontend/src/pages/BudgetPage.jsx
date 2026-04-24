import { useCallback, useEffect, useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import { FolderPlus, GripVertical, Save, Trash2 } from "lucide-react";
import { springReorder } from "../animations/variants";
import { mergeFilteredReorder } from "../utils/persistedOrder";
import { useCategories } from "../hooks/useCategories";
import Card from "../components/ui/Card";
import AlertCard from "../features/alerts/components/AlertCard";
import { useRealtimeFinanceUpdates } from "../hooks/useRealtimeFinanceUpdates";
import { budgetService } from "../features/budget/services/budgetService";
import { formatCurrency } from "../utils/formatters";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import ProgressBar from "../components/ui/ProgressBar";
import { useToast } from "../components/ui/ToastProvider";
import {
  defaultCategorySuggestions,
  filterCategorySuggestions,
  formatCategoryLabel,
} from "../features/budget/utils/categoryCatalog";

const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

const getBudgetStatus = (item) => {
  if (item?.isOverBudget || Number(item?.remaining) < 0) return "Over budget";
  if (Number(item?.percentage) >= 80) return "Nearly full";
  return "Healthy";
};

function BudgetPage() {
  const { showToast } = useToast();
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const [budget, setBudget] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "expense",
    icon: "💰",
  });
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("all");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetSuggestions, setBudgetSuggestions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [categoryPendingDelete, setCategoryPendingDelete] = useState(null);

  const {
    categories,
    groupedCategories,
    isLoading: categoriesLoading,
    refreshCategories,
    addCategory,
    deleteCategory,
    reorderCategories,
  } = useCategories();

  const handleCategoryListReorder = useCallback(
    (newFiltered) => {
      reorderCategories(mergeFilteredReorder(categories, newFiltered));
    },
    [categories, reorderCategories],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.name.toLowerCase(), item])),
    [categories],
  );

  const defaultSuggestionMap = useMemo(
    () =>
      new Map(
        defaultCategorySuggestions.map((item) => [
          item.name.toLowerCase(),
          item,
        ]),
      ),
    [],
  );

  const selectedBudgetCategory = useMemo(
    () => categoryMap.get(selectedCategory.toLowerCase()),
    [categoryMap, selectedCategory],
  );

  const categorySuggestions = useMemo(
    () =>
      categoryForm.name.trim()
        ? filterCategorySuggestions(categoryForm.name)
        : defaultCategorySuggestions,
    [categoryForm.name],
  );

  const filteredCategoriesForList = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return categories.filter((item) => {
      if (
        categoryTypeFilter !== "all" &&
        item.type !== categoryTypeFilter
      ) {
        return false;
      }
      if (!query) return true;
      return item.name.toLowerCase().includes(query);
    });
  }, [categories, categorySearch, categoryTypeFilter]);

  const getCategoryVisual = useCallback(
    (categoryName) => {
      const normalizedName = String(categoryName || "")
        .trim()
        .toLowerCase();
      return (
        categoryMap.get(normalizedName) ||
        defaultSuggestionMap.get(normalizedName) || {
          icon: "💰",
          type: "expense",
        }
      );
    },
    [categoryMap, defaultSuggestionMap],
  );

  const loadBudget = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [budgetResult, suggestionsResult, alertsResult] =
        await Promise.allSettled([
          budgetService.getBudget({ month, year }),
          budgetService.getBudgetSuggestions({ monthsBack: 6 }),
          budgetService.getBudgetAlerts({ month, year }),
        ]);

      if (budgetResult.status === "fulfilled") {
        setBudget(budgetResult.value);
      } else {
        throw budgetResult.reason;
      }

      setBudgetSuggestions(
        suggestionsResult.status === "fulfilled" &&
          Array.isArray(suggestionsResult.value)
          ? suggestionsResult.value
          : [],
      );
      setBudgetAlerts(
        alertsResult.status === "fulfilled" && Array.isArray(alertsResult.value)
          ? alertsResult.value
          : [],
      );
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load budget.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  useEffect(() => {
    if (categories.length === 0) {
      if (selectedCategory !== "") {
        setSelectedCategory("");
      }
      return;
    }

    const hasSelectedCategory = categories.some(
      (item) => item.name === selectedCategory,
    );

    if (!selectedCategory || !hasSelectedCategory) {
      const fallbackCategory =
        groupedCategories.expense[0]?.name ||
        groupedCategories.income[0]?.name ||
        categories[0].name;

      setSelectedCategory(fallbackCategory || "");
    }
  }, [categories, groupedCategories, selectedCategory]);

  const handleBudgetSave = async ({ category, monthlyBudget }) => {
    const data = await budgetService.setBudget({
      category,
      monthlyBudget,
      month,
      year,
    });
    setBudget(data);
    setMessage("Budget saved successfully.");
    await refreshCategories();
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();

    const trimmedName = categoryForm.name.trim();
    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    try {
      await addCategory(categoryForm);
      setCategoryForm({ name: "", type: "expense", icon: "💰" });
      setShowCategorySuggestions(false);
      setSelectedCategory(trimmedName);
      setMessage(`Category ${formatCategoryLabel(categoryForm)} added.`);
      showToast(`Category “${trimmedName}” added`, "success");
      await refreshCategories();
    } catch (createError) {
      setError(
        createError?.response?.data?.message ||
          createError?.message ||
          "Failed to create category.",
      );
    }
  };

  const handleBudgetSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(budgetAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Enter a valid budget amount.");
      return;
    }

    if (!selectedCategory) {
      setError("Add a category before saving a budget.");
      return;
    }

    try {
      await handleBudgetSave({
        category: selectedCategory,
        monthlyBudget: amount,
      });
      setBudgetAmount("");
      setMessage(`Budget saved for ${selectedCategory}.`);
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Failed to save budget.");
    }
  };

  const handleRealtimeBudgetEvent = useCallback((updatedBudget) => {
    if (updatedBudget) {
      setBudget(updatedBudget);
    }
    setMessage("Budget updated live.");
  }, []);

  useRealtimeFinanceUpdates({
    onBudgetEvent: handleRealtimeBudgetEvent,
  });

  const categoryBudgets = useMemo(() => budget?.categories || [], [budget]);
  const overallInsight = budget?.insight || "You're on track";
  const overBudgetCategories = categoryBudgets.filter(
    (item) => item.isOverBudget || Number(item.remaining) < 0,
  );
  const totalBudget = Number(
    budget?.totalBudget ?? budget?.monthlyBudget ?? budget?.totalAmount ?? 0,
  );
  const totalSpent = Number(
    budget?.totalSpent ?? budget?.budgetUsed ?? budget?.usedAmount ?? 0,
  );
  const remainingAmount = Number(
    budget?.remaining ?? budget?.remainingAmount ?? totalBudget - totalSpent,
  );
  const usagePercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleCategorySuggestionSelect = (suggestion) => {
    setCategoryForm({
      name: suggestion.name,
      type: suggestion.type,
      icon: suggestion.icon,
    });
    setShowCategorySuggestions(false);
  };

  const confirmDeleteCategory = async () => {
    const item = categoryPendingDelete;
    if (!item) return;
    try {
      const remainingCategories = categories.filter(
        (category) => category._id !== item._id,
      );
      await deleteCategory(item._id);
      if (selectedCategory === item.name) {
        setSelectedCategory(
          remainingCategories.find((category) => category.type === "expense")
            ?.name ||
            remainingCategories[0]?.name ||
            "",
        );
      }
      setMessage(`Category ${item.name} deleted.`);
      setCategoryPendingDelete(null);
      await refreshCategories();
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message || "Failed to delete category.",
      );
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-0">
      <Card
        as="section"
        className="border border-slate-200/80 transition duration-300 hover:shadow-lg dark:border-slate-800"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Budget
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Track each category against its own monthly target.
        </p>
        <Badge
          variant={overallInsight === "You're on track" ? "success" : "danger"}
          className="mt-2"
        >
          {overallInsight}
        </Badge>
      </Card>

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
      {isLoading && (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-700/40 dark:bg-sky-500/10 dark:text-sky-300">
          Loading budget...
        </p>
      )}

      {overBudgetCategories.length > 0 && (
        <Card className="border border-rose-200 bg-rose-50 text-rose-800 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="font-semibold">Budget exceeded</p>
          <p className="mt-1 text-sm">
            {overBudgetCategories.length} category
            {overBudgetCategories.length === 1 ? "" : "ies"} are over budget.
          </p>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Monthly Overview
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(totalSpent)} spent of{" "}
                {formatCurrency(totalBudget)}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/80">
                <p className="text-slate-500 dark:text-slate-400">Budget</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/80">
                <p className="text-slate-500 dark:text-slate-400">Spent</p>
                <p className="mt-1 font-semibold text-rose-600 dark:text-rose-300">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/80">
                <p className="text-slate-500 dark:text-slate-400">Remaining</p>
                <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-300">
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>
          </div>

          <ProgressBar percentage={usagePercentage} className="mt-5" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Using {formatPercent(usagePercentage)} of the monthly category
            budget pool.
          </p>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Manage Categories
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add and remove the categories used by budgets and
                    transactions.
                  </p>
                </div>
                <Badge variant="info">{categories.length} total</Badge>
              </div>

              <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
                <div className="relative">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <Input
                    value={categoryForm.name}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setCategoryForm((prev) => ({ ...prev, name: nextName }));
                      setShowCategorySuggestions(Boolean(nextName.trim()));
                    }}
                    onFocus={() => setShowCategorySuggestions(true)}
                    onBlur={() => {
                      window.setTimeout(
                        () => setShowCategorySuggestions(false),
                        150,
                      );
                    }}
                    placeholder="e.g. Groceries"
                  />

                  {showCategorySuggestions &&
                    categorySuggestions.length > 0 && (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Suggestions
                        </p>
                        <div className="max-h-52 overflow-auto p-2">
                          {categorySuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.type}-${suggestion.name}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleCategorySuggestionSelect(suggestion);
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                            >
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {formatCategoryLabel(suggestion)}
                              </span>
                              <Badge
                                variant={
                                  suggestion.type === "income"
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {suggestion.type}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                    Type
                    <select
                      value={categoryForm.type}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        setCategoryForm((prev) => ({
                          ...prev,
                          type: nextType,
                          icon: prev.icon || "💰",
                        }));
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                    Icon
                    <Input
                      value={categoryForm.icon}
                      onChange={(event) => {
                        const nextIcon = event.target.value;
                        setCategoryForm((prev) => ({
                          ...prev,
                          icon: nextIcon,
                        }));
                      }}
                      placeholder="💰"
                      maxLength={4}
                    />
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={categoriesLoading}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <FolderPlus
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  Add Category
                </Button>
              </form>

              {categoryForm.name.trim() && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Preview: {formatCategoryLabel(categoryForm)}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Search categories
                  <Input
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    placeholder="Filter by name…"
                    aria-label="Search categories"
                  />
                </label>
                <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 sm:w-44">
                  Type
                  <select
                    value={categoryTypeFilter}
                    onChange={(event) =>
                      setCategoryTypeFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
                  >
                    <option value="all">All</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
              </div>

              <div className="mt-4">
                {categories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No categories yet. Create one to start budgeting.
                  </div>
                ) : filteredCategoriesForList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No categories match your filters.
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                      Drag to reorder · order saved on this device
                    </p>
                    <Reorder.Group
                    axis="y"
                    values={filteredCategoriesForList}
                    onReorder={handleCategoryListReorder}
                    className="flex flex-col gap-3"
                  >
                    {filteredCategoriesForList.map((item) => (
                      <Reorder.Item
                        key={item._id}
                        value={item}
                        transition={springReorder}
                        className="relative list-none"
                        whileDrag={{
                          scale: 1.008,
                          boxShadow:
                            "0 16px 36px -18px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.15)",
                          zIndex: 2,
                        }}
                      >
                        <div className="flex cursor-grab items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 active:cursor-grabbing dark:border-slate-700">
                          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <GripVertical
                              className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-900">
                              {item.icon || "💰"}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item.type === "income" ? "Income" : "Expense"}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Badge
                              variant={
                                item.type === "income" ? "success" : "warning"
                              }
                            >
                              {item.type}
                            </Badge>
                            {item.isInUse && (
                              <Badge variant="warning">In use</Badge>
                            )}
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              className="h-8 w-8 cursor-pointer rounded-full px-0 py-0"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                if (item.isInUse) {
                                  setError(
                                    "Category is in use and cannot be deleted.",
                                  );
                                  return;
                                }
                                setCategoryPendingDelete(item);
                              }}
                              disabled={item.isInUse}
                              aria-label={`Delete ${item.name}`}
                              title={
                                item.isInUse
                                  ? "Category is in use"
                                  : `Delete ${item.name}`
                              }
                            >
                              <Trash2
                                className="h-4 w-4"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </Button>
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  </>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Card
                as="form"
                onSubmit={handleBudgetSubmit}
                className="border border-slate-200 dark:border-slate-700"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Set Budget
                </p>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  disabled={categories.length === 0}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
                >
                  {categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : null}
                  {groupedCategories.income.length > 0 && (
                    <optgroup label="Income">
                      {groupedCategories.income.map((item) => (
                        <option key={item._id || item.name} value={item.name}>
                          {formatCategoryLabel(item)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {groupedCategories.expense.length > 0 && (
                    <optgroup label="Expense">
                      {groupedCategories.expense.map((item) => (
                        <option key={item._id || item.name} value={item.name}>
                          {formatCategoryLabel(item)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {selectedBudgetCategory && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Selected: {formatCategoryLabel(selectedBudgetCategory)}
                  </p>
                )}
                <Input
                  value={budgetAmount}
                  onChange={(event) => setBudgetAmount(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Budget amount"
                  className="mt-3"
                />
                <Button
                  type="submit"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2"
                  variant="secondary"
                  disabled={categories.length === 0}
                >
                  <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  Save Budget
                </Button>
                {categories.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    Add a category first to create a budget.
                  </p>
                )}
              </Card>

              <Card className="border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Stats
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>{categoryBudgets.length} tracked categories</p>
                  <p>{overBudgetCategories.length} over budget</p>
                  <p>{formatPercent(usagePercentage)} used</p>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Category Budgets
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                Monthly breakdown
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {categoryBudgets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Create a category and assign a monthly budget to start tracking
                progress.
              </div>
            ) : (
              categoryBudgets.map((item) => {
                const progress = Math.min(Number(item.percentage || 0), 100);
                const categoryVisual = getCategoryVisual(item.category);

                return (
                  <Card
                    key={item.category}
                    className="border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-900">
                          {categoryVisual.icon || "💰"}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.category}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Spent {formatCurrency(item.spent)} of{" "}
                            {formatCurrency(item.budget)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={item.isOverBudget ? "danger" : "success"}>
                        {getBudgetStatus(item)}
                      </Badge>
                    </div>
                    <ProgressBar percentage={progress} className="mt-3" />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatPercent(item.percentage)}</span>
                      <span>{formatCurrency(item.remaining)} remaining</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Budget Suggestions
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                Based on recent spending
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {budgetSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Spend history is needed before recommendations can be generated.
              </p>
            ) : (
              budgetSuggestions.map((item) => {
                const categoryVisual = getCategoryVisual(item.category);

                return (
                  <Card
                    key={item.category}
                    className="border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-900">
                          {categoryVisual.icon || "💰"}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.category}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Avg spend{" "}
                            {formatCurrency(item.averageMonthlySpending)}
                          </p>
                        </div>
                      </div>
                      <strong className="text-lg text-slate-900 dark:text-white">
                        {formatCurrency(item.suggestedBudget)}
                      </strong>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.bufferPercent}% buffer applied</span>
                      <Badge
                        variant={
                          categoryVisual.type === "income"
                            ? "success"
                            : "warning"
                        }
                      >
                        {categoryVisual.type}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={async () => {
                          try {
                            await handleBudgetSave({
                              category: item.category,
                              monthlyBudget: item.suggestedBudget,
                            });
                            setMessage(
                              `Applied suggestion for ${item.category}.`,
                            );
                            await loadBudget();
                          } catch (saveError) {
                            setError(
                              saveError?.response?.data?.message ||
                                "Failed to apply suggestion.",
                            );
                          }
                        }}
                      >
                        Apply suggestion
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Budget Alerts
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                Over-limit warnings
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {budgetAlerts.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                You&apos;re on track.
              </p>
            ) : (
              budgetAlerts.map((alert, index) => (
                <AlertCard key={`${alert.type}-${index}`} alert={alert} />
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={Boolean(categoryPendingDelete)}
        onClose={() => setCategoryPendingDelete(null)}
        title="Delete category"
        description={
          categoryPendingDelete
            ? `Are you sure you want to delete “${categoryPendingDelete.name}”? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDeleteCategory}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </main>
  );
}

export default BudgetPage;
