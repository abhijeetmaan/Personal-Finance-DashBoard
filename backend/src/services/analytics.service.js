import { Account } from "../models/Account.js";
import { Card } from "../models/Card.js";
import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { CREDIT_CARD_PAYMENT_CATEGORY } from "../constants/financeConstants.js";
import { getAccountBalancesByIds } from "./account.service.js";
import { getCardOutstandingByIds } from "./card.service.js";
import {
  detectCategorySuggestion,
  getCategoryMetaByName,
} from "./categoryDetection.service.js";

const getMonthWindow = (month, year) => {
  const monthNumber = month ? Number(month) : new Date().getUTCMonth() + 1;
  const yearNumber = year ? Number(year) : new Date().getUTCFullYear();

  return {
    monthNumber,
    yearNumber,
    start: new Date(Date.UTC(yearNumber, monthNumber - 1, 1)),
    end: new Date(Date.UTC(yearNumber, monthNumber, 1)),
  };
};

const roundAmount = (value) => Number(Number(value || 0).toFixed(2));

const buildUserFilter = (userId) => ({ userId: userId || null });

const endOfUtcMonth = (year, month1to12) =>
  new Date(Date.UTC(year, month1to12, 0, 23, 59, 59, 999));

/**
 * Net worth from posted transactions only (not persisted).
 * Assets: per-account sum(income) − sum(expense) on that account.
 * Liabilities: credit-card purchases minus card payments (same category rules as ledger).
 */
async function computeNetWorthAsOf({ userId = null, endDate = new Date() } = {}) {
  const userMatch = buildUserFilter(userId);
  const dateMatch = { date: { $lte: endDate } };

  const [accounts, creditCards] = await Promise.all([
    Account.find({ ...userMatch, isActive: true }).lean(),
    Card.find({
      ...userMatch,
      type: "credit",
      isActive: true,
    }).lean(),
  ]);

  const [accountRows, cardRows] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          ...userMatch,
          ...dateMatch,
          accountId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$accountId",
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$type", "income"] },
                "$amount",
                { $multiply: ["$amount", -1] },
              ],
            },
          },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          ...userMatch,
          ...dateMatch,
          cardId: { $exists: true, $ne: null },
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$cardId",
          liability: {
            $sum: {
              $cond: [
                { $eq: ["$category", CREDIT_CARD_PAYMENT_CATEGORY] },
                { $multiply: ["$amount", -1] },
                "$amount",
              ],
            },
          },
        },
      },
    ]),
  ]);

  const balanceByAccount = new Map(
    accountRows.map((row) => [
      String(row._id),
      roundAmount(row.balance),
    ]),
  );
  const liabilityByCard = new Map(
    cardRows.map((row) => [
      String(row._id),
      roundAmount(Math.max(0, Number(row.liability || 0))),
    ]),
  );

  const totalAssets = roundAmount(
    accounts.reduce(
      (sum, account) =>
        sum + (balanceByAccount.get(String(account._id)) || 0),
      0,
    ),
  );

  const totalLiabilities = roundAmount(
    creditCards.reduce(
      (sum, card) => sum + (liabilityByCard.get(String(card._id)) || 0),
      0,
    ),
  );

  return {
    totalAssets,
    totalLiabilities,
    netWorth: roundAmount(totalAssets - totalLiabilities),
  };
}

export const analyticsService = {
  async getNetBalance({ userId = null } = {}) {
    const [accounts, creditCards] = await Promise.all([
      Account.find({ ...buildUserFilter(userId), isActive: true }).lean(),
      Card.find({
        ...buildUserFilter(userId),
        type: "credit",
        isActive: true,
      }).lean(),
    ]);

    const [balancesById, outstandingById] = await Promise.all([
      getAccountBalancesByIds({
        userId,
        accountIds: accounts.map((a) => a._id),
      }),
      getCardOutstandingByIds({
        userId,
        cardIds: creditCards.map((c) => c._id),
      }),
    ]);

    const totalAccountsBalance = roundAmount(
      accounts.reduce(
        (sum, account) =>
          sum + (balancesById.get(String(account._id)) || 0),
        0,
      ),
    );

    const totalCreditUsed = roundAmount(
      creditCards.reduce(
        (sum, card) =>
          sum + (outstandingById.get(String(card._id)) || 0),
        0,
      ),
    );

    return {
      totalAccountsBalance,
      totalCreditUsed,
      netAvailable: roundAmount(totalAccountsBalance - totalCreditUsed),
    };
  },

  async getNetWorth({ userId = null, months = 0 } = {}) {
    const now = new Date();
    const current = await computeNetWorthAsOf({ userId, endDate: now });

    let monthlyTrend = null;
    const n = Math.min(Math.max(Number(months) || 0, 0), 12);
    if (n > 0) {
      const y = now.getUTCFullYear();
      const m0 = now.getUTCMonth();
      const offsets = Array.from({ length: n }, (_, j) => n - 1 - j);

      const snapshots = await Promise.all(
        offsets.map(async (i) => {
          const d = new Date(Date.UTC(y, m0 - i, 1));
          const py = d.getUTCFullYear();
          const pm = d.getUTCMonth() + 1;
          const isCurrentPoint = i === 0;
          const endDate = isCurrentPoint ? now : endOfUtcMonth(py, pm);
          const snapshot = await computeNetWorthAsOf({ userId, endDate });
          return {
            year: py,
            month: pm,
            label: new Date(Date.UTC(py, pm - 1, 1)).toLocaleDateString(
              "en-US",
              { month: "short", year: "numeric" },
            ),
            ...snapshot,
          };
        }),
      );

      monthlyTrend = snapshots;
    }

    return {
      ...current,
      asOf: now.toISOString(),
      ...(monthlyTrend ? { monthlyTrend } : {}),
    };
  },

  /**
   * Month-end (or live for current month) net worth from transactions only.
   * @returns {Promise<Array<{ month: string, netWorth: number }>>}
   */
  async getNetWorthTrend({ userId = null, months = 12 } = {}) {
    const n = Math.min(Math.max(Number(months) || 12, 3), 24);
    const now = new Date();
    const y = now.getUTCFullYear();
    const m0 = now.getUTCMonth();
    const offsets = Array.from({ length: n }, (_, j) => n - 1 - j);

    const snapshots = await Promise.all(
      offsets.map(async (i) => {
        const d = new Date(Date.UTC(y, m0 - i, 1));
        const py = d.getUTCFullYear();
        const pm = d.getUTCMonth() + 1;
        const isLatest = i === 0;
        const endDate = isLatest ? now : endOfUtcMonth(py, pm);
        const { netWorth } = await computeNetWorthAsOf({ userId, endDate });
        return { py, pm, netWorth };
      }),
    );

    const spanYears = new Set(snapshots.map((s) => s.py)).size > 1;

    return snapshots.map((s) => ({
      month: spanYears
        ? new Date(Date.UTC(s.py, s.pm - 1, 1)).toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          })
        : new Date(Date.UTC(s.py, s.pm - 1, 1)).toLocaleDateString("en-US", {
            month: "short",
          }),
      netWorth: s.netWorth,
    }));
  },

  async getTopCategory({ userId = null, month, year } = {}) {
    const { monthNumber, yearNumber, start, end } = getMonthWindow(month, year);
    const match = {
      type: "expense",
      date: { $gte: start, $lt: end },
    };

    if (
      userId !== null &&
      userId !== undefined &&
      String(userId).trim() !== ""
    ) {
      match.userId = userId;
    }

    const [topRow] = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 1 },
    ]);

    if (!topRow) {
      const fallback = detectCategorySuggestion("", []);
      return {
        topCategory: fallback.name,
        amount: 0,
        icon: fallback.icon,
        month: monthNumber,
        year: yearNumber,
      };
    }

    const categoryName = String(topRow._id || "").trim() || "Other";
    const categoryDoc = await Category.findOne({
      userId: userId || null,
      name: new RegExp(
        `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    }).lean();

    const categoryMeta = getCategoryMetaByName(
      categoryName,
      categoryDoc ? [categoryDoc] : [],
    );

    return {
      topCategory: categoryMeta.name || categoryName,
      amount: roundAmount(topRow.amount),
      icon: categoryMeta.icon,
      month: monthNumber,
      year: yearNumber,
    };
  },
};
