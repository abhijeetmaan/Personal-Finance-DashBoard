import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { accountService } from "../services/account.service.js";

const validateAccountPayload = (body) => {
  if (body.name === undefined || String(body.name).trim() === "") {
    throw new ApiError(400, "Field 'name' is required");
  }
};

export const createAccount = asyncHandler(async (req, res) => {
  validateAccountPayload(req.body || {});
  const data = await accountService.createAccount(req.body || {});

  res.status(201).json({ success: true, data });
});

export const getAccounts = asyncHandler(async (req, res) => {
  const { userId, includeInactive } = req.query;
  const data = await accountService.listAccounts({
    userId,
    includeInactive: includeInactive === "true",
  });

  res.status(200).json({ success: true, data });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid account id");
  }

  const data = await accountService.deleteAccount({ userId, accountId: id });

  res.status(200).json({ success: true, data });
});

export const getAccountsSummary = asyncHandler(async (req, res) => {
  const { userId, lowBalanceThreshold } = req.query;
  const data = await accountService.getAccountsSummary({
    userId,
    lowBalanceThreshold,
  });

  res.status(200).json({ success: true, data });
});

export const transferBetweenAccounts = asyncHandler(async (req, res) => {
  const data = await accountService.transferBetweenAccounts(req.body || {});

  res.status(200).json({ success: true, data });
});
