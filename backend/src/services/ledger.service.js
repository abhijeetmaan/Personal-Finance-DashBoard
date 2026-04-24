import mongoose from "mongoose";
import { Card } from "../models/Card.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
import { Transaction } from "../models/Transaction.js";
import { CREDIT_CARD_PAYMENT_CATEGORY } from "../constants/financeConstants.js";
import { ApiError } from "../utils/ApiError.js";

const round2 = (value) => Number(Number(value || 0).toFixed(2));

const buildUserFilter = (userId) => ({ userId: userId || null });

/**
 * Asset accounts (bank/wallet/investment): net = debits − credits.
 * Liability (credit card): net owed = credits − debits.
 */
export const getAccountBalancesFromLedger = async ({
  userId = null,
  accountIds = [],
} = {}) => {
  if (!Array.isArray(accountIds) || accountIds.length === 0) {
    return new Map();
  }

  const rows = await LedgerEntry.aggregate([
    {
      $match: {
        ...buildUserFilter(userId),
        accountId: { $in: accountIds },
        cardId: null,
      },
    },
    {
      $group: {
        _id: "$accountId",
        debits: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "debit"] }, "$amount", 0],
          },
        },
        credits: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "credit"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      round2(Number(row.debits || 0) - Number(row.credits || 0)),
    ]),
  );
};

/** Net credit-card liability from ledger (credit − debit on card). */
export const getCardLiabilityFromLedger = async ({
  userId = null,
  cardIds = [],
} = {}) => {
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return new Map();
  }

  const rows = await LedgerEntry.aggregate([
    {
      $match: {
        ...buildUserFilter(userId),
        cardId: { $in: cardIds },
      },
    },
    {
      $group: {
        _id: "$cardId",
        debits: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "debit"] }, "$amount", 0],
          },
        },
        credits: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "credit"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      round2(Math.max(0, Number(row.credits || 0) - Number(row.debits || 0))),
    ]),
  );
};

function baseEntry(tx, overrides) {
  return {
    transactionId: tx._id,
    userId: tx.userId || null,
    category: tx.category,
    postedAt: tx.date ? new Date(tx.date) : new Date(),
    ...overrides,
  };
}

async function buildEntriesForTransaction(tx) {
  const raw = tx?.toObject ? tx.toObject() : { ...tx };
  const accountId = raw.accountId?._id ?? raw.accountId ?? null;
  const cardId = raw.cardId?._id ?? raw.cardId ?? null;
  const txNorm = { ...raw, accountId, cardId };

  const amount = round2(Math.abs(Number(txNorm.amount)));
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Invalid transaction amount for ledger");
  }

  const entries = [];

  if (txNorm.type === "income") {
    if (!accountId || cardId) {
      throw new ApiError(
        400,
        "Income ledger requires accountId and no cardId",
      );
    }
    entries.push(
      baseEntry(txNorm, {
        accountId,
        cardId: null,
        entryType: "debit",
        amount,
      }),
    );
    entries.push(
      baseEntry(txNorm, {
        accountId: null,
        cardId: null,
        entryType: "credit",
        amount,
      }),
    );
    return entries;
  }

  if (txNorm.type !== "expense") {
    throw new ApiError(400, "Unsupported transaction type for ledger");
  }

  if (accountId && cardId) {
    if (txNorm.category !== CREDIT_CARD_PAYMENT_CATEGORY) {
      throw new ApiError(
        400,
        "Expense with both account and card is only valid for credit card payments",
      );
    }
    entries.push(
      baseEntry(txNorm, {
        accountId: null,
        cardId,
        entryType: "debit",
        amount,
      }),
    );
    entries.push(
      baseEntry(txNorm, {
        accountId,
        cardId: null,
        entryType: "credit",
        amount,
      }),
    );
    return entries;
  }

  if (accountId && !cardId) {
    entries.push(
      baseEntry(txNorm, {
        accountId: null,
        cardId: null,
        entryType: "debit",
        amount,
      }),
    );
    entries.push(
      baseEntry(txNorm, {
        accountId,
        cardId: null,
        entryType: "credit",
        amount,
      }),
    );
    return entries;
  }

  if (cardId && !accountId) {
    const card = await Card.findById(cardId).lean();
    if (!card) {
      throw new ApiError(404, "Card not found for ledger posting");
    }

    if (card.type === "credit") {
      entries.push(
        baseEntry(txNorm, {
          accountId: null,
          cardId: null,
          entryType: "debit",
          amount,
        }),
      );
      entries.push(
        baseEntry(txNorm, {
          accountId: null,
          cardId,
          entryType: "credit",
          amount,
        }),
      );
      return entries;
    }

    const linked = card.linkedAccountId;
    if (!linked) {
      throw new ApiError(
        400,
        "Debit card must have linkedAccountId for ledger posting",
      );
    }

    const linkedId = linked._id ? linked._id : linked;
    const accountRef =
      linkedId instanceof mongoose.Types.ObjectId
        ? linkedId
        : new mongoose.Types.ObjectId(String(linkedId));

    entries.push(
      baseEntry(txNorm, {
        accountId: null,
        cardId: null,
        entryType: "debit",
        amount,
      }),
    );
    entries.push(
      baseEntry(txNorm, {
        accountId: accountRef,
        cardId: null,
        entryType: "credit",
        amount,
      }),
    );
    return entries;
  }

  throw new ApiError(
    400,
    "Expense must specify accountId and/or cardId for ledger posting",
  );
}

export async function replaceLedgerForTransaction(tx) {
  const plain = tx?.toObject ? tx.toObject() : { ...tx };
  if (!plain?._id) {
    return;
  }

  await LedgerEntry.deleteMany({ transactionId: plain._id });
  const entries = await buildEntriesForTransaction(plain);
  if (entries.length > 0) {
    await LedgerEntry.insertMany(entries);
  }
}

export async function syncLedgerForTransactionId(transactionId) {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    return;
  }
  const tx = await Transaction.findById(transactionId).lean();
  if (!tx) {
    await LedgerEntry.deleteMany({ transactionId });
    return;
  }
  await replaceLedgerForTransaction(tx);
}

export async function deleteLedgerForTransactionId(transactionId) {
  await LedgerEntry.deleteMany({ transactionId });
}

export async function backfillLedgerFromAllTransactions() {
  await LedgerEntry.deleteMany({});
  const cursor = Transaction.find({}).cursor();
  for await (const doc of cursor) {
    await replaceLedgerForTransaction(doc.toObject());
  }
}
