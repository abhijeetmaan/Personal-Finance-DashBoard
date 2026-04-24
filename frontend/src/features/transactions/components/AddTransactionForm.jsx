import { useEffect, useMemo, useState } from "react";
import { useCategories } from "../../../hooks/useCategories";
import { useAccounts } from "../../../hooks/useAccounts";
import { useCards } from "../../../hooks/useCards";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  detectCategorySuggestion,
  formatCategoryLabel,
  groupCategoriesByType,
} from "../../budget/utils/categoryCatalog";
import {
  formatAccountLabel,
  formatCardLabel,
} from "../../finance/utils/financeCatalog";
import { Loader2, Repeat, Save, X } from "lucide-react";

const initialState = {
  amount: "",
  type: "expense",
  category: "",
  accountId: "",
  cardId: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  notes: "",
  isRecurring: false,
  recurringFrequency: "monthly",
};

const getRelatedId = (value) => {
  if (!value || typeof value !== "object") {
    return String(value || "");
  }

  return String(value._id || value.id || "");
};

const toInitialFormState = (value) => {
  if (!value) {
    return initialState;
  }

  return {
    amount:
      value.amount !== undefined && value.amount !== null
        ? String(value.amount)
        : "",
    type: value.type || "expense",
    category: value.category || "",
    accountId: getRelatedId(value.accountId),
    cardId: getRelatedId(value.cardId),
    date: value.date
      ? new Date(value.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    description: value.description || value.notes || value.source || "",
    notes: value.notes || value.description || value.source || "",
    isRecurring: Boolean(value.isRecurring),
    recurringFrequency:
      value.recurringPattern?.frequency === "weekly"
        ? "weekly"
        : value.recurringPattern?.frequency === "yearly"
          ? "yearly"
          : "monthly",
  };
};

const MAX_AMOUNT = 1_000_000_000_000;
const MAX_CATEGORY_LEN = 80;
const MAX_NOTE_LEN = 500;

const validateForm = (form) => {
  const errors = {};

  if (!form.amount?.toString().trim()) {
    errors.amount = "Amount is required.";
  } else if (Number.isNaN(Number(form.amount))) {
    errors.amount = "Amount must be a valid number.";
  } else if (Number(form.amount) <= 0) {
    errors.amount = "Amount must be greater than zero.";
  } else if (Number(form.amount) > MAX_AMOUNT) {
    errors.amount = `Amount must be at most ${MAX_AMOUNT.toLocaleString()}.`;
  }

  if (!form.category) {
    errors.category = "Category is required.";
  } else if (String(form.category).length > MAX_CATEGORY_LEN) {
    errors.category = `Category must be at most ${MAX_CATEGORY_LEN} characters.`;
  }

  const desc = String(form.description || "");
  const notes = String(form.notes || "");
  if (desc.length > MAX_NOTE_LEN) {
    errors.description = `Description must be at most ${MAX_NOTE_LEN} characters.`;
  }
  if (notes.length > MAX_NOTE_LEN) {
    errors.notes = `Notes must be at most ${MAX_NOTE_LEN} characters.`;
  }

  if (!form.type) {
    errors.type = "Type is required.";
  }

  if (!form.date) {
    errors.date = "Date is required.";
  }

  if (form.type === "income") {
    if (!form.accountId) {
      errors.accountId = "Income must be linked to an account.";
    }
  } else if (!form.accountId && !form.cardId) {
    errors.accountId = "Select an account or a card.";
  }

  return errors;
};

function AddTransactionForm({
  onSubmit,
  initialValues = null,
  title = "Add Transaction",
  submitLabel = "Save Transaction",
  onCancel,
  compact = false,
}) {
  const [form, setForm] = useState(() => toInitialFormState(initialValues));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [typeTouched, setTypeTouched] = useState(false);
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { cards, isLoading: cardsLoading } = useCards();

  const categoryGroups = useMemo(
    () => groupCategoriesByType(categories),
    [categories],
  );

  useEffect(() => {
    setForm(toInitialFormState(initialValues));
    setErrors({});
    setCategoryTouched(false);
    setTypeTouched(false);
  }, [initialValues]);

  useEffect(() => {
    if (initialValues) return;

    const activeGroup =
      form.type === "income" ? categoryGroups.income : categoryGroups.expense;

    if (!form.category && activeGroup.length > 0) {
      setForm((prev) => ({ ...prev, category: activeGroup[0].name }));
    }
  }, [
    categoryGroups.expense,
    categoryGroups.income,
    form.category,
    form.type,
    initialValues,
  ]);

  useEffect(() => {
    if (initialValues) return;

    if (form.type === "income" && !form.accountId && accounts.length > 0) {
      setForm((prev) => ({
        ...prev,
        accountId: accounts[0]._id,
        cardId: "",
      }));
      return;
    }

    if (form.type === "expense" && !form.accountId && !form.cardId) {
      const defaultCard =
        cards.find((card) => card.type === "credit") || cards[0];
      const defaultAccount = accounts[0];

      if (defaultCard) {
        setForm((prev) => ({
          ...prev,
          cardId: defaultCard._id,
          accountId: "",
        }));
      } else if (defaultAccount) {
        setForm((prev) => ({
          ...prev,
          accountId: defaultAccount._id,
          cardId: "",
        }));
      }
    }
  }, [accounts, cards, form.accountId, form.cardId, form.type, initialValues]);

  const categorySuggestion = useMemo(
    () =>
      detectCategorySuggestion(
        form.description || form.notes || form.category,
        categories,
      ),
    [categories, form.category, form.description, form.notes],
  );

  const categoryOptions = useMemo(() => {
    const options = [...categories];

    if (
      form.category &&
      !options.some((category) => category.name === form.category)
    ) {
      options.unshift({ _id: form.category, name: form.category });
    }

    return options;
  }, [categories, form.category]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === form.accountId),
    [accounts, form.accountId],
  );

  const selectedCard = useMemo(
    () => cards.find((card) => card._id === form.cardId),
    [cards, form.cardId],
  );

  const isValid = useMemo(
    () =>
      Number(form.amount) > 0 &&
      form.date &&
      categoryOptions.length > 0 &&
      (form.type === "income"
        ? Boolean(form.accountId)
        : Boolean(form.accountId || form.cardId)),
    [
      form.accountId,
      form.amount,
      form.cardId,
      form.date,
      form.type,
      categoryOptions.length,
    ],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "description") {
        next.notes = value;

        if (next.type === "expense") {
          const suggestion = detectCategorySuggestion(value, categories);

          if (suggestion?.type && !typeTouched) {
            next.type = suggestion.type;
          }
        }
      }

      if (name === "type") {
        setTypeTouched(true);

        const matchingGroup =
          value === "income" ? categoryGroups.income : categoryGroups.expense;

        if (matchingGroup.length > 0 && !categoryTouched) {
          next.category = matchingGroup[0].name;
        }

        if (value === "income") {
          next.cardId = "";
          if (!next.accountId && accounts.length > 0) {
            next.accountId = accounts[0]._id;
          }
        }
      }

      if (name === "category") {
        setCategoryTouched(true);
      }

      if (name === "accountId") {
        next.cardId = "";
      }

      if (name === "cardId") {
        next.accountId = "";
      }

      return next;
    });

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSourceChange = (event) => {
    const selectedValue = event.target.value;
    if (!selectedValue) {
      setForm((prev) => ({ ...prev, accountId: "", cardId: "" }));
      return;
    }

    const [kind, sourceId] = selectedValue.split(":");
    setForm((prev) => ({
      ...prev,
      accountId: kind === "account" ? sourceId : "",
      cardId: kind === "card" ? sourceId : "",
    }));

    setErrors((prev) => {
      if (!prev.accountId) return prev;
      const nextErrors = { ...prev };
      delete nextErrors.accountId;
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || !isValid) return;

    setIsSubmitting(true);
    try {
      const wasSuccessful = await onSubmit({
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        description: form.description || form.notes,
        notes: form.notes || form.description,
        accountId: form.accountId || undefined,
        cardId: form.cardId || undefined,
        isRecurring: Boolean(form.isRecurring),
        recurringPattern: form.isRecurring
          ? {
              frequency: form.recurringFrequency,
              dayOfMonth: new Date(form.date).getUTCDate(),
            }
          : undefined,
      });

      if (wasSuccessful && !initialValues) {
        setForm(initialState);
        setErrors({});
        setCategoryTouched(false);
        setTypeTouched(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceValue = form.cardId
    ? `card:${form.cardId}`
    : form.accountId
      ? `account:${form.accountId}`
      : "";

  const formInner = (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Amount
          <Input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
          {errors.amount && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.amount}
            </small>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Type
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {errors.type && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.type}
            </small>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
          Funding source
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            Choose an account or a card (grouped below).
          </span>
          <select
            value={sourceValue}
            onChange={handleSourceChange}
            disabled={accountsLoading || cardsLoading}
            className="mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          >
            <option value="">Select a funding source</option>
            {accounts.length > 0 && (
              <optgroup label="Accounts">
                {accounts.map((account) => (
                  <option key={account._id} value={`account:${account._id}`}>
                    {formatAccountLabel(account)}
                  </option>
                ))}
              </optgroup>
            )}
            {form.type !== "income" && cards.length > 0 && (
              <optgroup label="Cards">
                {cards.map((card) => (
                  <option key={card._id} value={`card:${card._id}`}>
                    {formatCardLabel(card)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {errors.accountId && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.accountId}
            </small>
          )}
          {selectedAccount &&
            form.type === "expense" &&
            Number(form.amount) > 0 &&
            Number(selectedAccount.balance) < Number(form.amount) && (
              <small className="text-xs text-amber-600 dark:text-amber-300">
                Low balance warning: this expense is higher than the selected
                account balance.
              </small>
            )}
          {selectedCard &&
            selectedCard.type === "credit" &&
            selectedCard.limit > 0 &&
            selectedCard.usedAmount / selectedCard.limit >= 0.8 && (
              <small className="text-xs text-amber-600 dark:text-amber-300">
                80% limit used on the selected credit card.
              </small>
            )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Category
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            disabled={categoriesLoading || categoryOptions.length === 0}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          >
            {categoryOptions.length === 0 ? (
              <option value="">No categories available</option>
            ) : null}
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
          {errors.category && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.category}
            </small>
          )}
          {categoryOptions.length === 0 && (
            <small className="text-xs text-amber-600 dark:text-amber-300">
              Add a category in Budget before creating a transaction.
            </small>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Date
          <Input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
          {errors.date && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.date}
            </small>
          )}
        </label>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="isRecurring"
              checked={form.isRecurring}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isRecurring: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <Repeat className="h-4 w-4 text-violet-500" strokeWidth={2} />
            Recurring transaction
          </label>
          {form.isRecurring ? (
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
              Frequency
              <select
                name="recurringFrequency"
                value={form.recurringFrequency}
                onChange={handleChange}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
          ) : null}
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Groceries, cab ride, coffee..."
            rows={3}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-900/40"
          />
          <small className="text-xs text-slate-500 dark:text-slate-400">
            Descriptions are matched against your existing categories when
            possible.
          </small>
          {errors.description && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.description}
            </small>
          )}
          {errors.notes && (
            <small className="text-xs text-rose-600 dark:text-rose-300">
              {errors.notes}
            </small>
          )}
          {categorySuggestion?.name && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    category: categorySuggestion.name,
                  }));
                  setCategoryTouched(true);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Suggested: {formatCategoryLabel(categorySuggestion)}
              </button>
            </div>
          )}
        </label>

        <div className="flex gap-2 sm:col-span-2">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Cancel
            </Button>
          )}
          <Button
            className="flex-1 inline-flex items-center justify-center gap-2"
            variant="primary"
            size="md"
            type="submit"
            disabled={
              !isValid ||
              isSubmitting ||
              categoriesLoading ||
              accountsLoading ||
              cardsLoading
            }
          >
            {isSubmitting ? (
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
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
  );

  if (compact) {
    return formInner;
  }

  return (
    <AnimatedCard
      as="section"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800"
    >
      {title ? (
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      ) : null}
      <div className={title ? "mt-4" : ""}>{formInner}</div>
    </AnimatedCard>
  );
}

export default AddTransactionForm;
