import { Account } from "../models/Account.js";
import { Card } from "../models/Card.js";
import { Transaction } from "../models/Transaction.js";
import { CREDIT_CARD_PAYMENT_CATEGORY } from "../constants/financeConstants.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAuditLog } from "./audit.service.js";
import { getAccountBalancesByIds } from "./account.service.js";
import { getCardOutstandingByIds } from "./card.service.js";
import { syncLedgerForTransactionId } from "./ledger.service.js";

const normalizeNumber = (value) => Number(Number(value || 0).toFixed(2));

const ensureTransactionSelection = (transaction) => {
  const hasAccount = Boolean(transaction?.accountId);
  const hasCard = Boolean(transaction?.cardId);

  if (hasAccount && hasCard) {
    throw new ApiError(400, "Select either an account or a card, not both");
  }

  if (!hasAccount && !hasCard) {
    throw new ApiError(400, "Field 'accountId' or 'cardId' is required");
  }
};

const getCardRecord = async ({
  userId = null,
  cardId,
  allowInactiveCard = false,
}) => {
  const card = await Card.findOne({
    _id: cardId,
    userId: userId || null,
    ...(allowInactiveCard ? {} : { isActive: true }),
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
  const [usageMap, linkedAccountBalanceMap] = await Promise.all([
    getCardOutstandingByIds({ userId, cardIds: [card._id] }),
    card.linkedAccountId?._id
      ? getAccountBalancesByIds({
          userId,
          accountIds: [card.linkedAccountId._id],
        })
      : Promise.resolve(new Map()),
  ]);

  const usedAmount = normalizeNumber(usageMap.get(String(card._id)) || 0);
  if (card.linkedAccountId?._id) {
    card.linkedAccountId.balance = normalizeNumber(
      linkedAccountBalanceMap.get(String(card.linkedAccountId._id)) || 0,
    );
  }
  card.usedAmount = usedAmount;
  return card;
};

const getAccountRecord = async ({ userId = null, accountId }) => {
  const account = await Account.findOne({
    _id: accountId,
    userId: userId || null,
    isActive: true,
  }).lean();
  if (!account) {
    throw new ApiError(404, "Account not found");
  }
  return account;
};

const applyAccountImpact = async ({ userId, accountId, type, amount }) => {
  return getAccountRecord({ userId, accountId });
};

const reverseAccountImpact = async ({ userId, accountId, type, amount }) => {
  return getAccountRecord({ userId, accountId });
};

const applyCardImpact = async ({ userId, cardId, type, amount }) => {
  const card = await getCardRecord({ userId, cardId });

  if (card.type === "credit") {
    if (type !== "expense") {
      throw new ApiError(400, "Credit card transactions must be expenses");
    }
    return card;
  }

  if (!card.linkedAccountId) {
    throw new ApiError(400, "Debit cards must be linked to an account");
  }

  return getAccountRecord({
    userId,
    accountId: card.linkedAccountId,
  });
};

const reverseCardImpact = async ({
  userId,
  cardId,
  type,
  amount,
  allowInactiveCard = false,
}) => {
  const card = await getCardRecord({ userId, cardId, allowInactiveCard });

  if (card.type === "credit") {
    if (type !== "expense") {
      throw new ApiError(400, "Credit card transactions must be expenses");
    }
    return card;
  }

  if (!card.linkedAccountId) {
    throw new ApiError(400, "Debit cards must be linked to an account");
  }

  return getAccountRecord({
    userId,
    accountId: card.linkedAccountId,
  });
};

export const financeService = {
  async applyTransactionEffects(transaction) {
    ensureTransactionSelection(transaction);

    const amount = normalizeNumber(transaction?.amount);
    if (transaction?.accountId) {
      await applyAccountImpact({
        userId: transaction.userId || null,
        accountId: transaction.accountId,
        type: transaction.type,
        amount,
      });
      return;
    }

    await applyCardImpact({
      userId: transaction.userId || null,
      cardId: transaction.cardId,
      type: transaction.type,
      amount,
    });
  },

  async reverseTransactionEffects(transaction, options = {}) {
    ensureTransactionSelection(transaction);

    const amount = normalizeNumber(transaction?.amount);
    if (transaction?.accountId) {
      try {
        await reverseAccountImpact({
          userId: transaction.userId || null,
          accountId: transaction.accountId,
          type: transaction.type,
          amount,
        });
      } catch (error) {
        const canIgnoreMissingAccount =
          Boolean(options.allowMissingPaymentSource) &&
          error instanceof ApiError &&
          error.statusCode === 404;
        if (!canIgnoreMissingAccount) {
          throw error;
        }
      }
      return;
    }

    try {
      await reverseCardImpact({
        userId: transaction.userId || null,
        cardId: transaction.cardId,
        type: transaction.type,
        amount,
        allowInactiveCard: Boolean(options.allowInactiveCard),
      });
    } catch (error) {
      const canIgnoreMissingCard =
        Boolean(options.allowMissingPaymentSource) &&
        error instanceof ApiError &&
        error.statusCode === 404;
      if (!canIgnoreMissingCard) {
        throw error;
      }
    }
  },

  async payCardBill({ userId = null, cardId, accountId, amount }) {
    const card = await getCardRecord({ userId, cardId });

    if (card.type !== "credit") {
      throw new ApiError(400, "Only credit cards can have bills paid");
    }

    const billAmount = normalizeNumber(
      amount !== undefined && amount !== null ? amount : card.usedAmount,
    );

    if (billAmount <= 0) {
      throw new ApiError(400, "Bill amount must be greater than zero");
    }

    const outstanding = normalizeNumber(card.usedAmount);
    if (billAmount > outstanding) {
      throw new ApiError(
        400,
        "Bill amount cannot exceed outstanding card balance",
      );
    }

    const paymentAccountId = accountId || card.linkedAccountId?._id || card.linkedAccountId;

    if (!paymentAccountId) {
      throw new ApiError(400, "Select account to pay bill");
    }

    const paymentAccount = await getAccountRecord({
      userId,
      accountId: paymentAccountId,
    });

    if (!paymentAccount) {
      throw new ApiError(404, "Account not found");
    }

    const paymentTx = await Transaction.create({
      userId: userId || null,
      amount: billAmount,
      type: "expense",
      category: CREDIT_CARD_PAYMENT_CATEGORY,
      description: `Card bill payment for ${card.name}`,
      notes: `Card bill payment for ${card.name}`,
      source: "card-bill-payment",
      accountId: paymentAccountId,
      cardId: card._id,
      date: new Date(),
    });
    await syncLedgerForTransactionId(paymentTx._id);

    await recordAuditLog({
      action: "PAY_CREDIT_CARD_BILL",
      entityType: "transaction",
      entityId: paymentTx._id,
      userId: userId || null,
      metadata: {
        cardId: String(card._id),
        accountId: String(paymentAccountId),
        amount: billAmount,
      },
    });

    const nextOutstanding = Math.max(0, outstanding - billAmount);

    return {
      ...card,
      limit: normalizeNumber(card?.limit),
      usedAmount: nextOutstanding,
      remainingLimit: normalizeNumber(card?.limit) - nextOutstanding,
      usagePercentage:
        normalizeNumber(card?.limit) > 0
          ? (nextOutstanding / normalizeNumber(card?.limit)) * 100
          : 0,
      paidAmount: billAmount,
    };
  },

  async getSummary({ userId = null, month, year } = {}) {
    const [accounts, cards] = await Promise.all([
      Account.find({
        userId: userId || null,
        isActive: true,
      }).lean(),
      Card.find({ userId: userId || null, isActive: true })
        .populate({
          path: "linkedAccountId",
          match: { isActive: true },
          select: "name type isActive",
        })
        .lean(),
    ]);

    const creditCardIds = cards
      .filter((card) => card.type === "credit")
      .map((card) => card._id);

    const [accountBalancesById, creditUsageByCardId] = await Promise.all([
      getAccountBalancesByIds({
        userId,
        accountIds: accounts.map((account) => account._id),
      }),
      getCardOutstandingByIds({ userId, cardIds: creditCardIds }),
    ]);

    const totalAccountBalance = accounts.reduce(
      (sum, account) =>
        sum + normalizeNumber(accountBalancesById.get(String(account._id)) || 0),
      0,
    );
    const totalCreditUsed = cards.reduce(
      (sum, card) =>
        card.type === "credit"
          ? sum + normalizeNumber(creditUsageByCardId.get(String(card._id)) || 0)
          : sum,
      0,
    );

    const creditCards = cards.filter((card) => card.type === "credit");
    const totalCreditLimit = creditCards.reduce(
      (sum, card) => sum + normalizeNumber(card.limit),
      0,
    );
    const creditUtilizationPercent =
      totalCreditLimit > 0
        ? Math.round((totalCreditUsed / totalCreditLimit) * 10000) / 100
        : 0;

    const highCreditUtilizationWarning =
      totalCreditLimit > 0 && creditUtilizationPercent >= 80
        ? {
            message: `${creditUtilizationPercent}% of total credit limit is in use`,
            utilization: creditUtilizationPercent,
          }
        : null;

    let periodIncome;
    let periodExpense;
    const monthNum =
      month !== undefined && month !== null && String(month).trim() !== ""
        ? Number(month)
        : null;
    const yearNum =
      year !== undefined && year !== null && String(year).trim() !== ""
        ? Number(year)
        : null;

    if (
      monthNum !== null &&
      yearNum !== null &&
      !Number.isNaN(monthNum) &&
      !Number.isNaN(yearNum) &&
      monthNum >= 1 &&
      monthNum <= 12
    ) {
      const start = new Date(Date.UTC(yearNum, monthNum - 1, 1));
      const end = new Date(Date.UTC(yearNum, monthNum, 1));
      const [aggRow] = await Transaction.aggregate([
        {
          $match: {
            userId: userId || null,
            date: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            expense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
      ]);
      periodIncome = normalizeNumber(aggRow?.income || 0);
      periodExpense = normalizeNumber(aggRow?.expense || 0);
    }

    const bankAccounts = accounts.filter((account) => account.type === "bank");

    return {
      totalAccountBalance,
      totalCreditUsed,
      remainingBalance: totalAccountBalance - totalCreditUsed,
      totalCreditLimit,
      creditUtilizationPercent,
      highCreditUtilizationWarning,
      periodIncome,
      periodExpense,
      bankAccounts: bankAccounts.map((account) => ({
        ...account,
        balance: normalizeNumber(
          accountBalancesById.get(String(account._id)) || 0,
        ),
      })),
      accounts: accounts.map((account) => ({
        ...account,
        balance: normalizeNumber(
          accountBalancesById.get(String(account._id)) || 0,
        ),
      })),
      cards: cards.map((card) => ({
        ...card,
        usedAmount: normalizeNumber(
          card.type === "credit"
            ? creditUsageByCardId.get(String(card._id)) || 0
            : 0,
        ),
      })),
    };
  },
};
