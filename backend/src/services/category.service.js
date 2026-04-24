import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";

const normalizeName = (name) => String(name || "").trim();
const normalizeType = (type) => (type === "income" ? "income" : "expense");
const normalizeIcon = (icon) => String(icon || "").trim() || "💰";
const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUserFilter = (userId) => ({ userId: userId || null });

const buildCaseInsensitiveNameFilter = (name) => {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return null;
  }

  return new RegExp(`^${escapeRegExp(normalizedName)}$`, "i");
};

const buildUsageMap = async (Model, userId) => {
  const rows = await Model.aggregate([
    {
      $match: {
        ...buildUserFilter(userId),
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [normalizeName(row._id).toLowerCase(), row.count || 0]),
  );
};

export const findCategoryByName = async ({ userId = null, name }) => {
  const nameFilter = buildCaseInsensitiveNameFilter(name);
  if (!nameFilter) {
    return null;
  }

  return Category.findOne({
    ...buildUserFilter(userId),
    name: nameFilter,
  }).lean();
};

const normalizeCategoryDoc = (category) => ({
  ...category,
  type: normalizeType(category?.type),
  icon: normalizeIcon(category?.icon),
});

const isCategoryInUse = async ({ userId = null, categoryName }) => {
  const transactionInUse = await Transaction.exists({
    ...buildUserFilter(userId),
    category: categoryName,
  });
  return Boolean(transactionInUse);
};

export const upsertCategory = async ({ userId = null, name, type, icon }) => {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return null;
  }

  const normalizedType = normalizeType(type);
  const normalizedIcon = normalizeIcon(icon);

  const existing = await findCategoryByName({ userId, name: normalizedName });
  if (existing) {
    const shouldBackfillType = !existing.type;
    const shouldBackfillIcon = !existing.icon;

    if (shouldBackfillType || shouldBackfillIcon) {
      const updatedCategory = await Category.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            ...(shouldBackfillType ? { type: normalizedType } : {}),
            ...(shouldBackfillIcon ? { icon: normalizedIcon } : {}),
          },
        },
        { new: true },
      ).lean();

      return normalizeCategoryDoc(updatedCategory || existing);
    }

    return normalizeCategoryDoc(existing);
  }

  const category = await Category.create({
    userId: userId || null,
    name: normalizedName,
    type: normalizedType,
    icon: normalizedIcon,
  });

  return normalizeCategoryDoc(category.toObject());
};

export const listCategories = async ({ userId = null } = {}) => {
  const categories = await Category.find(buildUserFilter(userId))
    .sort({ name: 1 })
    .lean();

  return Promise.all(
    categories.map(async (category) => {
      const normalizedCategory = normalizeCategoryDoc(category);
      const categoryName = normalizeName(category.name);

      return {
        ...normalizedCategory,
        isInUse: await isCategoryInUse({
          userId,
          categoryName,
        }),
      };
    }),
  );
};

export const deleteCategory = async ({ userId = null, categoryId }) => {
  const category = await Category.findOne({
    _id: categoryId,
    ...buildUserFilter(userId),
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const categoryName = normalizeName(category.name);
  const inUse = await isCategoryInUse({ userId, categoryName });

  if (inUse) {
    throw new ApiError(409, "Category is in use and cannot be deleted");
  }

  await Category.deleteOne({ _id: category._id });

  return category.toObject();
};
