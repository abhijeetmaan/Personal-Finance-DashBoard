import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { cardService } from "../services/card.service.js";
import { financeService } from "../services/finance.service.js";

const validateCardPayload = (body) => {
  if (body.name === undefined || String(body.name).trim() === "") {
    throw new ApiError(400, "Field 'name' is required");
  }
};

const validateCardId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid card id");
  }
};

export const createCard = asyncHandler(async (req, res) => {
  validateCardPayload(req.body || {});
  const data = await cardService.createCard(req.body || {});

  res.status(201).json({ success: true, data });
});

export const getCards = asyncHandler(async (req, res) => {
  const { userId, includeInactive } = req.query;
  const data = await cardService.listCards({
    userId,
    includeInactive: includeInactive === "true",
  });

  res.status(200).json({ success: true, data });
});

export const payCardBill = asyncHandler(async (req, res) => {
  const { userId, cardId, accountId, amount } = req.body || {};
  validateCardId(cardId);

  const data = await financeService.payCardBill({
    userId,
    cardId,
    accountId,
    amount,
  });

  res.status(200).json({ success: true, data });
});

export const getCardBill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  validateCardId(id);

  const data = await cardService.getCardBill({ userId, cardId: id });

  res.status(200).json({ success: true, data });
});

export const deleteCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid card id");
  }

  const data = await cardService.deleteCard({ userId, cardId: id });

  res.status(200).json({ success: true, data });
});
