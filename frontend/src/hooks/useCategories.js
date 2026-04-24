import { useCallback, useEffect, useState } from "react";
import { budgetService } from "../features/budget/services/budgetService";
import {
  groupCategoriesByType,
  normalizeCategory,
} from "../features/budget/utils/categoryCatalog";
import {
  applySavedOrder,
  pruneOrderIds,
  readOrderIds,
  writeOrderIds,
  PFD_CATEGORY_ORDER_KEY,
} from "../utils/persistedOrder";

const normalizeName = (value) => String(value || "").trim();

const sortCategories = (items = []) =>
  [...items].sort((left, right) => {
    const typeOrder = left.type.localeCompare(right.type);
    if (typeOrder !== 0) {
      return typeOrder;
    }

    return left.name.localeCompare(right.name);
  });

const dedupeCategories = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeName(item?.name).toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCategories = useCallback(async () => {
    setIsLoading(true);

    try {
      const items = await budgetService.getCategories();
      const normalizedItems = Array.isArray(items)
        ? items
            .filter((item) => item?.name)
            .map((item) =>
              normalizeCategory({
                ...item,
                name: normalizeName(item.name),
              }),
            )
        : [];

      const nextCategories = sortCategories(dedupeCategories(normalizedItems));
      const ordered = applySavedOrder(
        nextCategories,
        readOrderIds(PFD_CATEGORY_ORDER_KEY),
      );
      setCategories(ordered);
      return ordered;
    } catch {
      setCategories([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const addCategory = useCallback(
    async (categoryInput) => {
      const payload =
        typeof categoryInput === "string"
          ? { name: categoryInput }
          : categoryInput || {};
      const trimmedName = normalizeName(payload.name);
      if (!trimmedName) {
        throw new Error("Category name is required.");
      }

      const alreadyExists = categories.some(
        (item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (alreadyExists) {
        throw new Error("Category already exists.");
      }

      const createdCategory = await budgetService.createCategory({
        name: trimmedName,
        type: payload.type,
        icon: payload.icon,
      });

      setCategories((currentCategories) => {
        const next = dedupeCategories([
          ...currentCategories,
          normalizeCategory({
            ...createdCategory,
            name: normalizeName(createdCategory?.name || trimmedName),
          }),
        ]);
        writeOrderIds(
          PFD_CATEGORY_ORDER_KEY,
          next.map((c) => c._id),
        );
        return next;
      });

      return createdCategory;
    },
    [categories],
  );

  const deleteCategory = useCallback(async (id) => {
    await budgetService.deleteCategory(id);
    setCategories((currentCategories) => {
      const next = currentCategories.filter((item) => item._id !== id);
      pruneOrderIds(
        PFD_CATEGORY_ORDER_KEY,
        next.map((item) => item._id),
      );
      return next;
    });
  }, []);

  const reorderCategories = useCallback((newOrder) => {
    writeOrderIds(
      PFD_CATEGORY_ORDER_KEY,
      newOrder.map((c) => c._id),
    );
    setCategories(newOrder);
  }, []);

  return {
    categories,
    groupedCategories: groupCategoriesByType(categories),
    incomeCategories: categories.filter(
      (category) => category.type === "income",
    ),
    expenseCategories: categories.filter(
      (category) => category.type !== "income",
    ),
    isLoading,
    refreshCategories,
    addCategory,
    deleteCategory,
    reorderCategories,
  };
}
