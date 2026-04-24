/** Category for card bill payments (expense on account + cardId). */
export const CREDIT_CARD_PAYMENT_CATEGORY = "Credit Card Payment";

/**
 * Expense `source` values that are internal ledger moves, not consumption.
 * Excluded from budget totals and category breakdown so transfers do not look like spending.
 */
export const BUDGET_EXCLUDED_EXPENSE_SOURCES = ["account-transfer"];

/** Excluded from P&L / cashflow operating view (internal movements & opening balance txs). */
export const REPORT_EXCLUDED_SOURCES = [
  "account-transfer",
  "account-setup",
  "card-setup",
];
