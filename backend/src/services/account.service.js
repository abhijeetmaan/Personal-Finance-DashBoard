import { Account } from "../models/Account.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAuditLog } from "./audit.service.js";
import {
  deleteLedgerForTransactionId,
  getAccountBalancesFromLedger,
  syncLedgerForTransactionId,
} from "./ledger.service.js";

const normalizeName = (value) => String(value || "").trim();
const normalizeType = (value) =>
  ["bank", "wallet", "investment"].includes(value) ? value : "bank";
const normalizeBalance = (value) => Number(Number(value || 0).toFixed(2));
const normalizeCurrency = (value) => {
  const code = String(value || "INR").trim().toUpperCase();
  return code || "INR";
};

const buildUserFilter = (userId) => ({ userId: userId || null });

export const getAccountById = async ({ userId = null, accountId }) => {
  return Account.findOne({
    _id: accountId,
    ...buildUserFilter(userId),
    isActive: true,
  }).lean();
};

export const getAccountBalancesByIds = async ({
  userId = null,
  accountIds = [],
} = {}) => {
  return getAccountBalancesFromLedger({ userId, accountIds });
};

export const accountService = {
  async createAccount({
    userId = null,
    name,
    type,
    balance,
    currency,
    color,
    icon,
  }) {
    const trimmedName = normalizeName(name);
    if (!trimmedName) {
      throw new ApiError(400, "Field 'name' is required");
    }

    const existingAccount = await Account.findOne({
      ...buildUserFilter(userId),
      name: trimmedName,
    });

    if (existingAccount) {
      if (existingAccount.isActive) {
        throw new ApiError(409, "Account with this name already exists");
      }

      existingAccount.type = normalizeType(type);
      existingAccount.currency = normalizeCurrency(currency);
      existingAccount.color = String(color || "").trim().slice(0, 32);
      existingAccount.icon = String(icon || "").trim().slice(0, 32);
      existingAccount.isActive = true;
      await existingAccount.save();
      const openingBalance = normalizeBalance(balance);
      if (openingBalance !== 0) {
        const openTx = await Transaction.create({
          userId: userId || null,
          amount: Math.abs(openingBalance),
          type: openingBalance >= 0 ? "income" : "expense",
          category: "Other",
          description: "Initial account opening balance",
          notes: "Initial account opening balance",
          source: "account-setup",
          accountId: existingAccount._id,
          date: new Date(),
        });
        await syncLedgerForTransactionId(openTx._id);
      }
      await recordAuditLog({
        action: "CREATE_ACCOUNT",
        entityType: "account",
        entityId: existingAccount._id,
        userId: existingAccount.userId,
        metadata: { name: existingAccount.name },
      });
      return existingAccount.toObject();
    }

    const account = await Account.create({
      userId: userId || null,
      name: trimmedName,
      type: normalizeType(type),
      currency: normalizeCurrency(currency),
      color: String(color || "").trim().slice(0, 32),
      icon: String(icon || "").trim().slice(0, 32),
    });

    const openingBalance = normalizeBalance(balance);
    if (openingBalance !== 0) {
      const openTx = await Transaction.create({
        userId: userId || null,
        amount: Math.abs(openingBalance),
        type: openingBalance >= 0 ? "income" : "expense",
        category: "Other",
        description: "Initial account opening balance",
        notes: "Initial account opening balance",
        source: "account-setup",
        accountId: account._id,
        date: new Date(),
      });
      await syncLedgerForTransactionId(openTx._id);
    }

    await recordAuditLog({
      action: "CREATE_ACCOUNT",
      entityType: "account",
      entityId: account._id,
      userId: account.userId,
      metadata: { name: account.name },
    });

    return account.toObject();
  },

  async listAccounts({ userId = null, includeInactive = false } = {}) {
    const query = includeInactive
      ? buildUserFilter(userId)
      : { ...buildUserFilter(userId), isActive: true };

    const accounts = await Account.find(query).sort({ name: 1 }).lean();
    const balancesById = await getAccountBalancesByIds({
      userId,
      accountIds: accounts.map((account) => account._id),
    });

    return accounts.map((account) => ({
      ...account,
      balance: normalizeBalance(balancesById.get(String(account._id)) || 0),
    }));
  },

  async getAccountsSummary({
    userId = null,
    lowBalanceThreshold,
  } = {}) {
    const accounts = await Account.find({
      ...buildUserFilter(userId),
      isActive: true,
    })
      .select("_id")
      .lean();

    const accountIds = accounts.map((a) => a._id);
    const balancesById = await getAccountBalancesByIds({ userId, accountIds });

    const balance = normalizeBalance(
      accountIds.reduce(
        (sum, id) => sum + (balancesById.get(String(id)) || 0),
        0,
      ),
    );

    const [aggRow] =
      accountIds.length === 0
        ? [null]
        : await Transaction.aggregate([
            {
              $match: {
                ...buildUserFilter(userId),
                accountId: { $in: accountIds },
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

    const totalIncome = normalizeBalance(aggRow?.income || 0);
    const totalExpense = normalizeBalance(aggRow?.expense || 0);

    let lowBalanceWarning = null;
    const thresholdNum = Number(lowBalanceThreshold);
    if (
      lowBalanceThreshold !== undefined &&
      lowBalanceThreshold !== null &&
      String(lowBalanceThreshold).trim() !== "" &&
      !Number.isNaN(thresholdNum)
    ) {
      if (balance < thresholdNum) {
        lowBalanceWarning = {
          threshold: normalizeBalance(thresholdNum),
          message: `Total balance is below ${normalizeBalance(thresholdNum)}`,
        };
      }
    }

    return {
      balance,
      totalIncome,
      totalExpense,
      lowBalanceWarning,
    };
  },

  async transferBetweenAccounts({
    userId = null,
    fromAccountId,
    toAccountId,
    amount,
    notes,
  }) {
    if (!fromAccountId || !toAccountId) {
      throw new ApiError(400, "fromAccountId and toAccountId are required");
    }

    if (String(fromAccountId) === String(toAccountId)) {
      throw new ApiError(400, "Cannot transfer to the same account");
    }

    const transferAmount = normalizeBalance(amount);
    if (transferAmount <= 0) {
      throw new ApiError(400, "Transfer amount must be greater than zero");
    }

    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({
        _id: fromAccountId,
        ...buildUserFilter(userId),
        isActive: true,
      }).lean(),
      Account.findOne({
        _id: toAccountId,
        ...buildUserFilter(userId),
        isActive: true,
      }).lean(),
    ]);

    if (!fromAccount) {
      throw new ApiError(404, "Source account not found");
    }

    if (!toAccount) {
      throw new ApiError(404, "Destination account not found");
    }

    const balancesById = await getAccountBalancesByIds({
      userId,
      accountIds: [fromAccount._id, toAccount._id],
    });
    const fromBalance = normalizeBalance(
      balancesById.get(String(fromAccount._id)) || 0,
    );

    if (fromBalance < transferAmount) {
      throw new ApiError(400, "Insufficient balance in source account");
    }

    const description = `Transfer to ${toAccount.name}`;
    const descriptionIn = `Transfer from ${fromAccount.name}`;
    const noteText = String(notes || "").trim();

    // Avoid MongoDB multi-document transactions: they require a replica set and
    // fail on a typical standalone local mongod (500 "Transaction numbers are only allowed on a replica set member").
    const outTx = await Transaction.create({
      userId: userId || null,
      amount: transferAmount,
      type: "expense",
      category: "Transfer",
      description,
      notes: noteText || description,
      source: "account-transfer",
      accountId: fromAccount._id,
      date: new Date(),
    });
    await syncLedgerForTransactionId(outTx._id);

    let inTx;
    try {
      inTx = await Transaction.create({
        userId: userId || null,
        amount: transferAmount,
        type: "income",
        category: "Transfer",
        description: descriptionIn,
        notes: noteText || descriptionIn,
        source: "account-transfer",
        accountId: toAccount._id,
        date: new Date(),
      });
    } catch (error) {
      await deleteLedgerForTransactionId(outTx._id);
      await Transaction.deleteOne({ _id: outTx._id });
      throw error;
    }

    await syncLedgerForTransactionId(inTx._id);

    await recordAuditLog({
      action: "ACCOUNT_TRANSFER",
      entityType: "account",
      entityId: fromAccount._id,
      userId: userId || null,
      metadata: {
        fromAccountId: String(fromAccount._id),
        toAccountId: String(toAccount._id),
        amount: transferAmount,
      },
    });

    const nextBalances = await getAccountBalancesByIds({
      userId,
      accountIds: [fromAccount._id, toAccount._id],
    });

    return {
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      amount: transferAmount,
      fromBalanceAfter: normalizeBalance(
        nextBalances.get(String(fromAccount._id)) || 0,
      ),
      toBalanceAfter: normalizeBalance(
        nextBalances.get(String(toAccount._id)) || 0,
      ),
    };
  },

  async deleteAccount({ userId = null, accountId }) {
    const account = await Account.findOne({
      _id: accountId,
      ...buildUserFilter(userId),
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }

    const transactionCount = await Transaction.countDocuments({
      ...buildUserFilter(userId),
      accountId: account._id,
    });

    if (transactionCount > 0) {
      account.isActive = false;
      await account.save();
      await recordAuditLog({
        action: "DEACTIVATE_ACCOUNT",
        entityType: "account",
        entityId: account._id,
        userId: account.userId,
        metadata: { name: account.name },
      });
      return account.toObject();
    }

    await Account.deleteOne({ _id: account._id });
    await recordAuditLog({
      action: "DELETE_ACCOUNT",
      entityType: "account",
      entityId: account._id,
      userId: account.userId,
      metadata: { name: account.name },
    });
    return account.toObject();
  },
};
