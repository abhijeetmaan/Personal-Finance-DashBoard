import { useMemo } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { useCategories } from "../../../hooks/useCategories";
import { useAccounts } from "../../../hooks/useAccounts";
import { useCards } from "../../../hooks/useCards";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  formatCategoryLabel,
  groupCategoriesByType,
} from "../../budget/utils/categoryCatalog";
import {
  formatAccountLabel,
  formatCardLabel,
} from "../../finance/utils/financeCatalog";

function TransactionFilters({
  filters,
  onChange,
  onReset,
  hideDateRange = false,
  periodLabel = "",
}) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { cards } = useCards();

  const categoryGroups = useMemo(
    () => groupCategoriesByType(categories),
    [categories],
  );

  const sourceValue =
    filters.cardId && String(filters.cardId)
      ? `card:${filters.cardId}`
      : filters.accountId && String(filters.accountId)
        ? `account:${filters.accountId}`
        : "";

  const handleSourceChange = (event) => {
    const v = event.target.value;
    if (!v) {
      onChange("accountId", "");
      onChange("cardId", "");
      return;
    }
    const [kind, id] = v.split(":");
    if (kind === "account") {
      onChange("accountId", id);
      onChange("cardId", "");
    } else {
      onChange("cardId", id);
      onChange("accountId", "");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter
            className="h-5 w-5 text-violet-500 dark:text-violet-400"
            strokeWidth={2}
            aria-hidden
          />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Filters
            </h2>
            {periodLabel ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {periodLabel}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-1.5 !rounded-xl"
        >
          <RotateCcw
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          Reset
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 opacity-70" strokeWidth={2} />
            Search
          </span>
          <Input
            type="search"
            value={filters.search || ""}
            onChange={(e) => onChange("search", e.target.value)}
            placeholder="Merchant, category, notes…"
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
          Account / card
          <select
            value={sourceValue}
            onChange={handleSourceChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          >
            <option value="">All sources</option>
            {accounts.length > 0 ? (
              <optgroup label="Accounts">
                {accounts.map((account) => (
                  <option key={account._id} value={`account:${account._id}`}>
                    {formatAccountLabel(account)}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {cards.length > 0 ? (
              <optgroup label="Cards">
                {cards.map((card) => (
                  <option key={card._id} value={`card:${card._id}`}>
                    {formatCardLabel(card)}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Type
          <select
            value={filters.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Category
          <select
            value={filters.category}
            onChange={(e) => onChange("category", e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          >
            <option value="">All categories</option>
            {categoryGroups.income.length > 0 && (
              <optgroup label="Income">
                {categoryGroups.income.map((category) => (
                  <option
                    key={category._id || category.name}
                    value={category.name}
                  >
                    {formatCategoryLabel(category)}
                  </option>
                ))}
              </optgroup>
            )}
            {categoryGroups.expense.length > 0 && (
              <optgroup label="Expense">
                {categoryGroups.expense.map((category) => (
                  <option
                    key={category._id || category.name}
                    value={category.name}
                  >
                    {formatCategoryLabel(category)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        {!hideDateRange ? (
          <>
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              From
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => onChange("startDate", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              To
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => onChange("endDate", e.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default TransactionFilters;
