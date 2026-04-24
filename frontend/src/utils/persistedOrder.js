export const PFD_CATEGORY_ORDER_KEY = "pfd-category-order";
export const PFD_ACCOUNT_ORDER_KEY = "pfd-account-order";

export function readOrderIds(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeOrderIds(key, ids) {
  localStorage.setItem(key, JSON.stringify(ids));
}

/**
 * Reorder `items` to match `savedIds` (unknown / new ids append in original order).
 */
export function applySavedOrder(items = [], savedIds) {
  if (!Array.isArray(items) || items.length === 0) {
    return Array.isArray(items) ? [...items] : [];
  }
  if (!Array.isArray(savedIds) || savedIds.length === 0) {
    return [...items];
  }
  const byId = new Map(items.map((i) => [i._id, i]));
  const out = [];
  const seen = new Set();
  for (const id of savedIds) {
    const row = byId.get(id);
    if (row) {
      out.push(row);
      seen.add(id);
    }
  }
  for (const item of items) {
    if (!seen.has(item._id)) {
      out.push(item);
    }
  }
  return out;
}

export function pruneOrderIds(key, validIds) {
  const saved = readOrderIds(key);
  if (!saved) {
    return;
  }
  const valid = new Set(validIds);
  const next = saved.filter((id) => valid.has(id));
  writeOrderIds(key, next);
}

/**
 * Replace the filtered subsequence in `fullOrdered` with `filteredReordered` (same ids).
 */
export function mergeFilteredReorder(fullOrdered, filteredReordered) {
  const filteredIds = new Set(filteredReordered.map((i) => i._id));
  let fi = 0;
  return fullOrdered.map((item) => {
    if (filteredIds.has(item._id)) {
      return filteredReordered[fi++];
    }
    return item;
  });
}
