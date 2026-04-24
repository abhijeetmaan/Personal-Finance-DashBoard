import { Account } from "../models/Account.js";
import { Card } from "../models/Card.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import {
  daysBetween,
  getCurrentBillingCycle,
  getNextDueDate,
} from "../utils/billingCycle.js";
import { getAccountBalancesByIds } from "./account.service.js";
import {
  getCardLiabilityFromLedger,
  syncLedgerForTransactionId,
} from "./ledger.service.js";

const normalizeName = (value) => String(value || "").trim();
const normalizeType = (value) => (value === "debit" ? "debit" : "credit");
const normalizeNumber = (value) => Number(Number(value || 0).toFixed(2));
const normalizeDay = (value, fallback = 1) => {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
    throw new ApiError(400, "Day values must be integers between 1 and 31");
  }

  return parsed;
};

const buildUserFilter = (userId) => ({ userId: userId || null });

const getLinkedAccountOrThrow = async ({ userId = null, linkedAccountId }) => {
  if (!linkedAccountId) {
    return null;
  }

  const account = await Account.findOne({
    _id: linkedAccountId,
    ...buildUserFilter(userId),
    isActive: true,
  }).lean();

  if (!account) {
    throw new ApiError(400, "Linked account not found");
  }

  return account;
};

const DUE_REMINDER_DAYS = 7;
const HIGH_UTILIZATION_PCT = 80;

const mapCard = (card, options = {}) => {
  const limit = normalizeNumber(card?.limit);
  const usedAmount = normalizeNumber(card?.usedAmount);
  const utilization = limit > 0 ? (usedAmount / limit) * 100 : 0;
  const nextDue = getNextDueDate(card?.dueDate ?? 1);
  const daysUntilDue = daysBetween(new Date(), nextDue);

  let dueDateAlert = null;
  if (
    card?.type === "credit" &&
    daysUntilDue >= 0 &&
    daysUntilDue <= DUE_REMINDER_DAYS &&
    usedAmount > 0
  ) {
    dueDateAlert = {
      message: `Payment due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,
      daysLeft: daysUntilDue,
    };
  }

  let highUtilizationWarning = null;
  if (card?.type === "credit" && limit > 0 && utilization >= HIGH_UTILIZATION_PCT) {
    highUtilizationWarning = {
      message: `${Math.round(utilization)}% of credit limit used`,
      utilization: Math.round(utilization * 100) / 100,
    };
  }

  return {
    ...card,
    limit,
    usedAmount,
    available: Math.max(0, normalizeNumber(limit - usedAmount)),
    remainingLimit: limit - usedAmount,
    utilization: Math.round(utilization * 100) / 100,
    usagePercentage: utilization,
    dueInDays: daysUntilDue,
    ...(options.includeAlerts !== false
      ? { dueDateAlert, highUtilizationWarning }
      : {}),
  };
};

/** Net credit-card liability derived from double-entry ledger (credits − debits on card). */
export const getCardOutstandingByIds = async ({
  userId = null,
  cardIds = [],
} = {}) => {
  return getCardLiabilityFromLedger({ userId, cardIds });
};

export const getCardById = async ({ userId = null, cardId }) => {
  const card = await Card.findOne({
    _id: cardId,
    ...buildUserFilter(userId),
    isActive: true,
  })
    .populate({
      path: "linkedAccountId",
      match: { isActive: true },
      select: "name type isActive",
    })
    .lean();

  if (!card) {
    return null;
  }

  const usedAmountById = await getCardOutstandingByIds({
    userId,
    cardIds: [card._id],
  });
  const usedAmount = normalizeNumber(usedAmountById.get(String(card._id)) || 0);

  if (card.linkedAccountId?._id) {
    const balanceMap = await getAccountBalancesByIds({
      userId,
      accountIds: [card.linkedAccountId._id],
    });
    card.linkedAccountId.balance = normalizeNumber(
      balanceMap.get(String(card.linkedAccountId._id)) || 0,
    );
  }

  return mapCard({ ...card, usedAmount });
};

export const cardService = {
  async createCard({
    userId = null,
    name,
    type,
    limit,
    usedAmount,
    billingCycleStart,
    dueDate,
    linkedAccountId,
    icon,
  }) {
    const trimmedName = normalizeName(name);
    if (!trimmedName) {
      throw new ApiError(400, "Field 'name' is required");
    }

    if (linkedAccountId) {
      await getLinkedAccountOrThrow({ userId, linkedAccountId });
    }

    const card = await Card.create({
      userId: userId || null,
      name: trimmedName,
      type: normalizeType(type),
      limit: normalizeNumber(limit),
      billingCycleStart: normalizeDay(billingCycleStart, 1),
      dueDate: normalizeDay(dueDate, 1),
      linkedAccountId: linkedAccountId || null,
      icon: String(icon || "").trim().slice(0, 32),
    });

    const initialUsedAmount = Math.max(0, normalizeNumber(usedAmount));
    if (initialUsedAmount > 0) {
      const setupTx = await Transaction.create({
        userId: userId || null,
        amount: initialUsedAmount,
        type: "expense",
        category: "Other",
        description: "Initial card used amount",
        notes: "Initial card used amount",
        source: "card-setup",
        cardId: card._id,
        date: new Date(),
      });
      await syncLedgerForTransactionId(setupTx._id);
    }

    const populated = await Card.findById(card._id)
      .populate({
        path: "linkedAccountId",
        match: { isActive: true },
        select: "name type isActive",
      })
      .lean();

    return getCardById({ userId, cardId: populated._id });
  },

  async listCards({ userId = null, includeInactive = false } = {}) {
    const query = includeInactive
      ? buildUserFilter(userId)
      : { ...buildUserFilter(userId), isActive: true };

    const cards = await Card.find(query)
      .sort({ name: 1 })
      .populate({
        path: "linkedAccountId",
        match: { isActive: true },
        select: "name type isActive",
      })
      .lean();
    const usedAmountById = await getCardOutstandingByIds({
      userId,
      cardIds: cards.map((card) => card._id),
    });
    const linkedAccountIds = cards
      .map((card) => card.linkedAccountId?._id)
      .filter(Boolean);
    const accountBalancesById = await getAccountBalancesByIds({
      userId,
      accountIds: linkedAccountIds,
    });

    return cards.map((card) => {
      if (card.linkedAccountId?._id) {
        card.linkedAccountId.balance = normalizeNumber(
          accountBalancesById.get(String(card.linkedAccountId._id)) || 0,
        );
      }
      return mapCard({
        ...card,
        usedAmount: normalizeNumber(usedAmountById.get(String(card._id)) || 0),
      });
    });
  },

  async getCreditBillStatus({ userId = null, cardId }) {
    const card = await Card.findOne({
      _id: cardId,
      ...buildUserFilter(userId),
      isActive: true,
    })
      .populate({
        path: "linkedAccountId",
        match: { isActive: true },
        select: "name type isActive",
      })
      .lean();

    if (!card) {
      throw new ApiError(404, "Card not found");
    }

    return getCardById({ userId, cardId: card._id });
  },

  async getCardBill({ userId = null, cardId }) {
    const card = await Card.findOne({
      _id: cardId,
      ...buildUserFilter(userId),
      isActive: true,
    }).lean();

    if (!card) {
      throw new ApiError(404, "Card not found");
    }

    if (card.type !== "credit") {
      throw new ApiError(400, "Billing is only available for credit cards");
    }

    const { cycleStart, cycleEnd } = getCurrentBillingCycle(card.billingCycleStart);
    const [row] = await Transaction.aggregate([
      {
        $match: {
          ...buildUserFilter(userId),
          cardId: card._id,
          type: "expense",
          date: { $gte: cycleStart, $lte: cycleEnd },
          $or: [{ accountId: null }, { accountId: { $exists: false } }],
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalBill = normalizeNumber(row?.total || 0);
    const nextDue = getNextDueDate(card.dueDate);
    const daysLeft = Math.max(0, daysBetween(new Date(), nextDue));

    return {
      totalBill,
      dueDate: nextDue.toISOString(),
      daysLeft,
    };
  },

  async deleteCard({ userId = null, cardId }) {
    const card = await Card.findOne({
      _id: cardId,
      ...buildUserFilter(userId),
    });

    if (!card) {
      throw new ApiError(404, "Card not found");
    }

    const cardUsageById = await getCardOutstandingByIds({
      userId,
      cardIds: [card._id],
    });
    if (Number(cardUsageById.get(String(card._id)) || 0) > 0) {
      throw new ApiError(400, "Pay pending bill before deleting");
    }

    await Card.deleteOne({ _id: card._id });
    return card.toObject();
  },
};
