import { transactionService } from "../services/transaction.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import {
  emitTransactionAdded,
  emitTransactionDeleted,
  emitTransactionUpdated,
} from "../realtime/socket.js";
import { detectCategorySuggestion } from "../services/categoryDetection.service.js";
import { CREDIT_CARD_PAYMENT_CATEGORY } from "../constants/financeConstants.js";
import { getAccountById } from "../services/account.service.js";
import { getCardById } from "../services/card.service.js";

const VALID_TYPES = new Set(["income", "expense"]);
const MAX_AMOUNT = 1_000_000_000_000;
const MAX_CATEGORY_LEN = 80;
const MAX_TEXT_LEN = 500;

const isMissing = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const validateDateValue = (value, fieldName) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Field '${fieldName}' must be a valid date`);
  }
};

const validateIdParam = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid transaction id");
  }
};

const validateTransactionPayload = (body, { partial = false } = {}) => {
  if (!partial) {
    const requiredFields = ["amount", "type", "category", "date"];
    for (const field of requiredFields) {
      if (isMissing(body[field])) {
        throw new ApiError(400, `Field '${field}' is required`);
      }
    }
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (Number.isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      throw new ApiError(
        400,
        `Field 'amount' must be a number greater than 0 and at most ${MAX_AMOUNT}`,
      );
    }
  }

  if (body.type !== undefined && !VALID_TYPES.has(body.type)) {
    throw new ApiError(
      400,
      "Field 'type' must be either 'income' or 'expense'",
    );
  }

  if (body.category !== undefined && isMissing(body.category)) {
    throw new ApiError(400, "Field 'category' is required");
  }

  if (body.category !== undefined && !isMissing(body.category)) {
    const cat = String(body.category).trim();
    if (cat.length > MAX_CATEGORY_LEN) {
      throw new ApiError(
        400,
        `Field 'category' must be at most ${MAX_CATEGORY_LEN} characters`,
      );
    }
  }

  const checkLen = (value, field, max) => {
    if (value === undefined || value === null) return;
    if (String(value).length > max) {
      throw new ApiError(400, `Field '${field}' must be at most ${max} characters`);
    }
  };

  checkLen(body.description, "description", MAX_TEXT_LEN);
  checkLen(body.notes, "notes", MAX_TEXT_LEN);
  checkLen(body.source, "source", MAX_TEXT_LEN);

  if (body.accountId !== undefined && !isMissing(body.accountId)) {
    if (!mongoose.Types.ObjectId.isValid(body.accountId)) {
      throw new ApiError(400, "Field 'accountId' must be a valid id");
    }
  }

  if (body.cardId !== undefined && !isMissing(body.cardId)) {
    if (!mongoose.Types.ObjectId.isValid(body.cardId)) {
      throw new ApiError(400, "Field 'cardId' must be a valid id");
    }
  }

  if (!partial) {
    const hasAccount = !isMissing(body.accountId);
    const hasCard = !isMissing(body.cardId);
    const isCardPayment =
      String(body.category || "").trim() === CREDIT_CARD_PAYMENT_CATEGORY;

    if (hasAccount && hasCard && !isCardPayment) {
      throw new ApiError(400, "Select either an account or a card, not both");
    }

    if (isCardPayment && (!hasAccount || !hasCard)) {
      throw new ApiError(
        400,
        "Credit card bill payments must include both accountId and cardId",
      );
    }

    if (!hasAccount && !hasCard) {
      throw new ApiError(400, "Field 'accountId' or 'cardId' is required");
    }
  }

  if (body.date !== undefined) {
    validateDateValue(body.date, "date");
  }

  if (body.isRecurring !== undefined && typeof body.isRecurring !== "boolean") {
    throw new ApiError(400, "Field 'isRecurring' must be a boolean");
  }

  if (body.recurringPattern !== undefined && body.recurringPattern !== null) {
    const rp = body.recurringPattern;
    if (typeof rp !== "object" || Array.isArray(rp)) {
      throw new ApiError(400, "Field 'recurringPattern' must be an object");
    }
    if (
      rp.frequency !== undefined &&
      rp.frequency !== null &&
      !["weekly", "monthly", "yearly"].includes(rp.frequency)
    ) {
      throw new ApiError(
        400,
        "recurringPattern.frequency must be weekly, monthly, or yearly",
      );
    }
    if (rp.dayOfMonth !== undefined && rp.dayOfMonth !== null) {
      const d = Number(rp.dayOfMonth);
      if (!Number.isInteger(d) || d < 1 || d > 31) {
        throw new ApiError(
          400,
          "recurringPattern.dayOfMonth must be an integer from 1 to 31",
        );
      }
    }
  }
};

const applyAutoDetectedCategory = async (body) => {
  if (!body || !isMissing(body.category)) {
    return;
  }

  const description = [body.notes, body.source, body.description]
    .filter((value) => !isMissing(value))
    .join(" ");

  const suggestion = detectCategorySuggestion(description);
  if (suggestion?.name) {
    body.category = suggestion.name;
  }
};

const normalizeTransactionDescription = (body) => {
  if (!body) return;

  const description =
    body.description ?? body.notes ?? body.source ?? body.category ?? "";

  body.description = String(description || "").trim();
  if (isMissing(body.notes)) {
    body.notes = body.description;
  }
};

const validatePaymentSelection = async (body) => {
  if (!body) return;

  if (!isMissing(body.accountId)) {
    const account = await getAccountById({
      userId: body.userId || null,
      accountId: body.accountId,
    });
    if (!account) {
      throw new ApiError(404, "Account not found");
    }
  }

  if (!isMissing(body.cardId)) {
    const card = await getCardById({
      userId: body.userId || null,
      cardId: body.cardId,
    });
    if (!card) {
      throw new ApiError(404, "Card not found");
    }
  }
};

export const createTransaction = asyncHandler(async (req, res) => {
  normalizeTransactionDescription(req.body);
  await applyAutoDetectedCategory(req.body);
  validateTransactionPayload(req.body);
  await validatePaymentSelection(req.body);
  const transaction = await transactionService.createTransaction(req.body);
  emitTransactionAdded(transaction);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const data = await transactionService.getTransactions(req.query);

  res.status(200).json({
    success: true,
    data,
  });
});

const csvEscape = (value) => {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportTransactionsCsv = asyncHandler(async (req, res) => {
  const rows = await transactionService.listTransactionsForExport(req.query);
  const header = [
    "date_iso",
    "type",
    "amount",
    "category",
    "description",
    "account_name",
    "card_name",
    "notes",
    "source",
  ];
  const lines = [header.join(",")];

  for (const row of rows) {
    const accountName = row.accountId?.name || "";
    const cardName = row.cardId?.name || "";
    lines.push(
      [
        csvEscape(new Date(row.date).toISOString()),
        csvEscape(row.type),
        csvEscape(row.amount),
        csvEscape(row.category),
        csvEscape(row.description),
        csvEscape(accountName),
        csvEscape(cardName),
        csvEscape(row.notes),
        csvEscape(row.source),
      ].join(","),
    );
  }

  const csv = `\uFEFF${lines.join("\n")}`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="transactions-export.csv"',
  );
  res.send(csv);
});

export const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateIdParam(id);
  const transaction = await transactionService.getTransactionById(id);

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateIdParam(id);

  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request body is required");
  }

  normalizeTransactionDescription(req.body);
  await applyAutoDetectedCategory(req.body);
  validateTransactionPayload(req.body, { partial: true });
  await validatePaymentSelection({
    ...req.body,
    userId: req.body.userId || null,
  });
  const transaction = await transactionService.updateTransaction(id, req.body);
  emitTransactionUpdated(transaction);

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateIdParam(id);
  await transactionService.deleteTransaction(id);
  emitTransactionDeleted({ id });

  res.status(200).json({
    success: true,
    message: "Transaction deleted successfully",
  });
});
