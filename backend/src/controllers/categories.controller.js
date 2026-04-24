import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteCategory,
  listCategories,
  upsertCategory,
} from "../services/category.service.js";
import mongoose from "mongoose";

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

export const createCategory = asyncHandler(async (req, res) => {
  const { userId, name, type, icon } = req.body;

  if (isBlank(name)) {
    throw new ApiError(400, "Field 'name' is required");
  }

  const category = await upsertCategory({ userId, name, type, icon });

  res.status(201).json({
    success: true,
    data: category,
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const categories = await listCategories({ userId });

  res.status(200).json({
    success: true,
    data: categories,
  });
});

export const removeCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category id");
  }

  await deleteCategory({ userId, categoryId: id });

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
