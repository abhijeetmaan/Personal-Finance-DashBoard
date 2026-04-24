import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAuditLog } from "./audit.service.js";
import { findCategoryByName } from "./category.service.js";
import {
  deleteLedgerForTransactionId,
  replaceLedgerForTransaction,
  syncLedgerForTransactionId,
} from "./ledger.service.js";
import {
  detectCategorySuggestion,
  getCategoryMetaByName,
} from "./categoryDetection.service.js";

const TRANSACTION_POPULATE_PATHS = [
  { path: "accountId", select: "name type" },
  {
    path: "cardId",
    select: "name type limit billingCycleStart dueDate linkedAccountId",
    populate: {
      path: "linkedAccountId",
      select: "name type",
    },
  },
];

const normalizeCategory = (value) => String(value || "").trim();
const RESERVED_SYSTEM_CATEGORY_NAMES = new Set([
  "opening balance",
  "initial balance",
]);

const resolveAndUpsertCategory = async ({
  userId = null,
  category,
  notes,
  source,
  description,
}) => {
  const normalizedCategory = normalizeCategory(category);

  const textualInput = [notes, source, description]
    .filter(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    )
    .join(" ");
  const suggestion = detectCategorySuggestion(textualInput);
  const categoryName = normalizedCategory || suggestion.name;
  const normalizedCategoryName = normalizeCategory(categoryName).toLowerCase();

  if (RESERVED_SYSTEM_CATEGORY_NAMES.has(normalizedCategoryName)) {
    return "Other";
  }

  if (!categoryName) {
    throw new ApiError(400, "Field 'category' is required");
  }

  const existingCategory = await findCategoryByName({
    userId,
    name: categoryName,
  });

  if (!existingCategory) {
    const categoryMeta = getCategoryMetaByName(categoryName, []);
    const createdCategory = await (
      await import("./category.service.js")
    ).upsertCategory({
      userId,
      name: categoryName,
      type: suggestion?.type || categoryMeta.type,
      icon: suggestion?.icon || categoryMeta.icon,
    });

    return createdCategory?.name || categoryName;
  }

  return existingCategory.name;
};

const normalizeTransactionDescription = (payload) =>
  String(
    payload?.description || payload?.notes || payload?.source || "",
  ).trim();

const parseValidDate = (value, label) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${label} must be a valid date`);
  }
  return parsed;
};

const buildTransactionFilters = (query) => {
  const {
    userId,
    type,
    category,
    month,
    year,
    startDate,
    endDate,
    accountId,
    cardId,
    search,
  } = query;

  const filters = {};

  if (userId) {
    filters.userId = userId;
  }

  if (type) {
    filters.type = type;
  }

  if (category) {
    filters.category = category;
  }

  if (accountId && mongoose.Types.ObjectId.isValid(String(accountId))) {
    filters.accountId = accountId;
  }

  if (cardId && mongoose.Types.ObjectId.isValid(String(cardId))) {
    filters.cardId = cardId;
  }

  const searchTerm = String(search || "").trim();
  if (searchTerm) {
    const capped = searchTerm.slice(0, 120);
    const escaped = capped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.$or = [
      { category: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { notes: { $regex: escaped, $options: "i" } },
    ];
  }

  if (month) {
    const monthNumber = Number(month);
    const yearNumber = Number(year) || new Date().getFullYear();

    if (monthNumber < 1 || monthNumber > 12) {
      throw new ApiError(400, "Month must be between 1 and 12");
    }

    const monthStart = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
    const monthEnd = new Date(Date.UTC(yearNumber, monthNumber, 1));

    filters.date = {
      $gte: monthStart,
      $lt: monthEnd,
    };
  } else if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = parseValidDate(startDate, "startDate");
    if (endDate) filters.date.$lte = parseValidDate(endDate, "endDate");

    if (
      filters.date.$gte &&
      filters.date.$lte &&
      filters.date.$gte > filters.date.$lte
    ) {
      throw new ApiError(400, "startDate cannot be later than endDate");
    }
  }

  return filters;
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isMonthlyGap = (previousDate, currentDate) => {
  const diffDays = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
  return diffDays >= 25 && diffDays <= 35;
};

const isSimilarAmount = (a, b) => {
  const first = Number(a || 0);
  const second = Number(b || 0);
  const tolerance = Math.max(2, Math.max(first, second) * 0.05);
  return Math.abs(first - second) <= tolerance;
};

const getCategoryGroupKey = (transaction) =>
  `${normalizeText(transaction.userId)}|${normalizeText(transaction.category)}`;

const selectorKey = ({ userId, category }) =>
  `${normalizeText(userId)}|${normalizeText(category)}`;

const toGroupSelector = (transaction) => ({
  userId: transaction?.userId || null,
  category: transaction?.category || "",
});

const markRecurringInGroup = (group, bulkUpdates) => {
  const sorted = [...group].sort((a, b) => new Date(a.date) - new Date(b.date));
  let activeChain = [];

  const flushChain = () => {
    const recurring = activeChain.length >= 2;
    const recurringPattern = recurring
      ? {
          frequency: "monthly",
          dayOfMonth: new Date(activeChain[0].date).getDate(),
        }
      : { frequency: null, dayOfMonth: null };

    activeChain.forEach((transaction) => {
      bulkUpdates.push({
        updateOne: {
          filter: { _id: transaction._id },
          update: {
            $set: {
              isRecurring: recurring,
              recurringPattern,
            },
          },
        },
      });
    });
  };

  sorted.forEach((transaction) => {
    if (activeChain.length === 0) {
      activeChain = [transaction];
      return;
    }

    const previous = activeChain[activeChain.length - 1];
    const previousDate = new Date(previous.date);
    const currentDate = new Date(transaction.date);

    if (
      isMonthlyGap(previousDate, currentDate) &&
      isSimilarAmount(previous.amount, transaction.amount)
    ) {
      activeChain.push(transaction);
      return;
    }

    flushChain();
    activeChain = [transaction];
  });

  if (activeChain.length > 0) {
    flushChain();
  }
};

const refreshRecurringFlags = async (selectors = []) => {
  const normalizedSelectors = selectors
    .map(toGroupSelector)
    .filter((item) => item.category);

  const uniqueSelectors = Array.from(
    new Map(
      normalizedSelectors.map((item) => [selectorKey(item), item]),
    ).values(),
  );

  const query = {
    type: "expense",
  };

  if (uniqueSelectors.length > 0) {
    query.$or = uniqueSelectors.map((item) => ({
      userId: item.userId,
      category: item.category,
    }));
  }

  const transactions = await Transaction.find(query).sort({ date: 1 });

  const groupedTransactions = new Map();

  transactions.forEach((transaction) => {
    const recurringKey = getCategoryGroupKey(transaction);
    if (!groupedTransactions.has(recurringKey)) {
      groupedTransactions.set(recurringKey, []);
    }
    groupedTransactions.get(recurringKey).push(transaction);
  });

  const bulkUpdates = [];

  groupedTransactions.forEach((group) => {
    markRecurringInGroup(group, bulkUpdates);
  });

  if (bulkUpdates.length > 0) {
    await Transaction.bulkWrite(bulkUpdates);
  }
};

const populateTransaction = async (transaction) => {
  if (!transaction) {
    return null;
  }

  return Transaction.populate(transaction, TRANSACTION_POPULATE_PATHS);
};

const normalizeRecurringFields = (payload) => {
  const isRecurring = Boolean(payload.isRecurring);
  if (!isRecurring) {
    return {
      isRecurring: false,
      recurringPattern: { frequency: null, dayOfMonth: null },
    };
  }

  const rawFreq = payload.recurringPattern?.frequency;
  const frequency = ["weekly", "monthly", "yearly"].includes(rawFreq)
    ? rawFreq
    : "monthly";

  let dayOfMonth = null;
  if (payload.recurringPattern?.dayOfMonth != null) {
    const d = Number(payload.recurringPattern.dayOfMonth);
    if (Number.isInteger(d) && d >= 1 && d <= 31) {
      dayOfMonth = d;
    }
  }
  if (dayOfMonth == null && payload.date) {
    dayOfMonth = new Date(payload.date).getUTCDate();
  }

  return {
    isRecurring: true,
    recurringPattern: { frequency, dayOfMonth },
  };
};

export const transactionService = {
  async createTransaction(payload) {
    const description = normalizeTransactionDescription(payload);
    const category = await resolveAndUpsertCategory({
      userId: payload.userId || null,
      category: payload.category,
      notes: payload.notes,
      source: payload.source,
      description,
    });

    const recurring = normalizeRecurringFields(payload);

    const transaction = await Transaction.create({
      ...payload,
      userId: payload.userId || null,
      category,
      description,
      isRecurring: recurring.isRecurring,
      recurringPattern: recurring.recurringPattern,
    });

    try {
      await replaceLedgerForTransaction(transaction);
    } catch (error) {
      await deleteLedgerForTransactionId(transaction._id);
      await Transaction.deleteOne({ _id: transaction._id });
      throw error;
    }

    try {
      if (transaction.type === "expense") {
        await refreshRecurringFlags([toGroupSelector(transaction)]);
      }
    } catch (error) {
      await deleteLedgerForTransactionId(transaction._id);
      await Transaction.deleteOne({ _id: transaction._id });
      throw error;
    }

    await recordAuditLog({
      action: "CREATE_TRANSACTION",
      entityType: "transaction",
      entityId: transaction._id,
      userId: transaction.userId,
      metadata: {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
      },
    });

    return populateTransaction(transaction.toObject());
  },

  async listTransactionsForExport(query) {
    const filters = buildTransactionFilters(query);
    const MAX_EXPORT = 5000;

    return Transaction.find(filters)
      .sort({ date: -1, createdAt: -1 })
      .limit(MAX_EXPORT)
      .populate(TRANSACTION_POPULATE_PATHS)
      .lean();
  },

  async getTransactions(query) {
    const { page = 1, limit = 20 } = query;

    const filters = buildTransactionFilters(query);

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Transaction.find(filters)
        .sort({ date: -1, createdAt: -1 })
        .populate(TRANSACTION_POPULATE_PATHS)
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit),
      Transaction.countDocuments(filters),
    ]);

    return {
      items,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
      },
    };
  },

  async getTransactionById(id) {
    const transaction = await Transaction.findById(id).populate(
      TRANSACTION_POPULATE_PATHS,
    );
    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    return transaction;
  },

  async updateTransaction(id, payload) {
    const existing = await Transaction.findById(id);
    if (!existing) {
      throw new ApiError(404, "Transaction not found");
    }

    const mergedPayload = {
      ...existing.toObject(),
      ...payload,
    };

    const description = normalizeTransactionDescription(mergedPayload);

    const category =
      payload.category !== undefined
        ? await resolveAndUpsertCategory({
            userId: mergedPayload.userId || null,
            category: payload.category,
            notes: mergedPayload.notes,
            source: mergedPayload.source,
            description,
          })
        : existing.category;

    let recurringPatch = {};
    if (
      payload.isRecurring !== undefined ||
      payload.recurringPattern !== undefined
    ) {
      recurringPatch = normalizeRecurringFields({
        ...mergedPayload,
        isRecurring:
          payload.isRecurring !== undefined
            ? payload.isRecurring
            : mergedPayload.isRecurring,
        recurringPattern:
          payload.recurringPattern !== undefined
            ? payload.recurringPattern
            : mergedPayload.recurringPattern,
        date: mergedPayload.date,
      });
    }

    const updatePayload = {
      ...payload,
      category,
      description,
      ...recurringPatch,
    };

    const nextTransaction = {
      ...existing.toObject(),
      ...updatePayload,
      _id: existing._id,
    };

    try {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id },
        updatePayload,
        { new: true, runValidators: true },
      ).populate(TRANSACTION_POPULATE_PATHS);

      if (!transaction) {
        throw new ApiError(404, "Transaction not found");
      }

      try {
        if (existing.type === "expense" || transaction.type === "expense") {
          await refreshRecurringFlags([
            toGroupSelector(existing),
            toGroupSelector(transaction),
          ]);
        }
      } catch (error) {
        await Transaction.findOneAndUpdate({ _id: id }, existing.toObject(), {
          new: true,
          runValidators: false,
        });
        await syncLedgerForTransactionId(id);
        throw error;
      }

      await replaceLedgerForTransaction(transaction);
      await recordAuditLog({
        action: "UPDATE_TRANSACTION",
        entityType: "transaction",
        entityId: transaction._id,
        userId: transaction.userId,
        metadata: {
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
        },
      });

      return transaction;
    } catch (error) {
      throw error;
    }
  },

  async deleteTransaction(id) {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    await deleteLedgerForTransactionId(transaction._id);
    await Transaction.findByIdAndDelete(id);

    try {
      if (transaction.type === "expense") {
        await refreshRecurringFlags([toGroupSelector(transaction)]);
      }
    } catch (error) {
      const restored = await Transaction.create(transaction.toObject());
      await replaceLedgerForTransaction(restored);
      throw error;
    }

    await recordAuditLog({
      action: "DELETE_TRANSACTION",
      entityType: "transaction",
      entityId: transaction._id,
      userId: transaction.userId,
      metadata: {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
      },
    });

    return transaction;
  },
};
