import { memo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil, Repeat, Trash2 } from "lucide-react";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import AnimatedCard from "../../../components/ui/AnimatedCard";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import SwipeActionRow from "../../../components/gestures/SwipeActionRow";
import {
  formatAccountLabel,
  formatCardLabel,
} from "../../finance/utils/financeCatalog";
import {
  getTransactionCategoryDisplay,
  getTransactionSourceTags,
} from "../utils/transactionDisplay";
import { staggerContainer, staggerItem } from "../../../animations/variants";

const getTransactionSourceLabel = (transaction) => {
  if (transaction.accountId?.name) {
    return formatAccountLabel(transaction.accountId);
  }

  if (transaction.cardId?.name) {
    return formatCardLabel(transaction.cardId);
  }

  return "Cash / Unassigned";
};

const tagVariantForKey = (key) => {
  if (key === "transfer") return "warning";
  if (key === "card") return "info";
  if (key === "bank") return "success";
  return "neutral";
};

const cardShell = (compact) =>
  [
    "flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition duration-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 sm:flex-row",
    compact ? "p-3" : "p-4",
  ].join(" ");

function TransactionList({
  transactions = [],
  onDelete,
  onEdit,
  isLoading = false,
  error = "",
  title = "Transactions",
  emptyDescription = "Add a transaction to see it listed here.",
  headerAction = null,
  compact = false,
}) {
  const reduceMotion = useReducedMotion();
  const [openSwipeId, setOpenSwipeId] = useState(null);
  const listVariants = reduceMotion
    ? { hidden: {}, visible: { transition: { staggerChildren: 0 } } }
    : staggerContainer;
  const itemVariants = reduceMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : staggerItem;

  const swipeEnabled = !reduceMotion && Boolean(onDelete || onEdit);

  return (
    <AnimatedCard as="section" className="!p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {headerAction}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {(compact ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5]).map((key) => (
            <Skeleton
              key={key}
              className={compact ? "h-[3.25rem] w-full" : "h-[4.5rem] w-full"}
            />
          ))}
        </div>
      ) : error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : transactions.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No transactions yet"
            description={emptyDescription}
            icon="🧾"
          />
        </div>
      ) : (
        <motion.ul
          className="mt-4 flex list-none flex-col gap-3 p-0"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {transactions.map((transaction) => {
            const categoryMeta = getTransactionCategoryDisplay(transaction);
            const tags = getTransactionSourceTags(transaction);

            const rowBody = (
              <div className={cardShell(compact)}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
                      aria-hidden="true"
                    >
                      {categoryMeta.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {transaction.category}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {categoryMeta.type === "income" ? "Income" : "Expense"}
                        {compact
                          ? ` · ${getTransactionSourceLabel(transaction)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {!compact && tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={`${transaction._id}-${tag.key}`}
                          variant={tagVariantForKey(tag.key)}
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {!compact ? (
                    <>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        via {getTransactionSourceLabel(transaction)}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {transaction.description ||
                          transaction.notes ||
                          "No description"}
                      </p>
                    </>
                  ) : null}

                  {transaction.isRecurring && !compact ? (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
                      <Repeat className="h-3.5 w-3.5" strokeWidth={2} />
                      {transaction.recurringPattern?.frequency || "monthly"}{" "}
                      recurring
                    </span>
                  ) : null}
                  {onDelete ? (
                    <div
                      className={[
                        "mt-3 gap-2",
                        swipeEnabled ? "hidden md:flex" : "flex",
                      ].join(" ")}
                    >
                      {onEdit && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(transaction)}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Pencil
                            className="h-3.5 w-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                          Edit
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(transaction)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Trash2
                          className="h-3.5 w-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                  {swipeEnabled ? (
                    <p className="mt-2 text-[11px] text-slate-400 md:hidden dark:text-slate-500">
                      {onEdit && onDelete
                        ? "Swipe: left delete · right edit"
                        : onDelete
                          ? "Swipe left to delete"
                          : "Swipe right to edit"}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p
                    className={
                      transaction.type === "income"
                        ? "text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-300"
                        : "text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-300"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(transaction.date)}
                  </p>
                </div>
              </div>
            );

            return (
              <motion.li
                key={transaction._id}
                variants={itemVariants}
                layout={!reduceMotion}
                className="list-none p-0"
              >
                {swipeEnabled ? (
                  <SwipeActionRow
                    rowId={transaction._id}
                    openRowId={openSwipeId}
                    onOpenChange={setOpenSwipeId}
                    onEdit={
                      onEdit ? () => onEdit(transaction) : undefined
                    }
                    onDelete={
                      onDelete ? () => onDelete(transaction) : undefined
                    }
                  >
                    {rowBody}
                  </SwipeActionRow>
                ) : (
                  rowBody
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </AnimatedCard>
  );
}

export default memo(TransactionList);
