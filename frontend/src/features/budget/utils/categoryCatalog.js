export const defaultCategorySuggestions = [
  { name: "Food", icon: "🍔", type: "expense" },
  { name: "Travel", icon: "✈️", type: "expense" },
  { name: "Salary", icon: "💼", type: "income" },
  { name: "Freelance", icon: "💻", type: "income" },
  { name: "Shopping", icon: "🛍️", type: "expense" },
  { name: "Entertainment", icon: "🎬", type: "expense" },
  { name: "Housing", icon: "🏠", type: "expense" },
  { name: "Utilities", icon: "💡", type: "expense" },
];

export const keywordMap = {
  food: [
    "swiggy",
    "zomato",
    "restaurant",
    "cafe",
    "food",
    "dinner",
    "lunch",
    "breakfast",
    "meal",
  ],
  travel: [
    "uber",
    "ola",
    "flight",
    "train",
    "taxi",
    "cab",
    "metro",
    "bus",
    "ride",
  ],
  shopping: [
    "amazon",
    "flipkart",
    "mall",
    "shopping",
    "purchase",
    "store",
    "myntra",
  ],
  bills: [
    "electricity",
    "water",
    "rent",
    "bill",
    "internet",
    "gas",
    "utility",
    "recharge",
  ],
  salary: ["salary", "payroll", "stipend", "paycheck", "wage"],
  freelance: ["freelance", "client", "invoice", "project", "contract"],
};

const normalizeName = (value) => String(value || "").trim();
const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeName = (value) =>
  normalizeName(value).toLowerCase().split(/\s+/).filter(Boolean);

export const normalizeCategory = (category) => ({
  ...category,
  name: normalizeName(category?.name),
  type: category?.type === "income" ? "income" : "expense",
  icon: String(category?.icon || "").trim() || "💰",
});

export const formatCategoryLabel = (category) => {
  const normalized = normalizeCategory(category);
  return `${normalized.icon} ${normalized.name}`.trim();
};

export const groupCategoriesByType = (categories = []) => ({
  income: categories.filter((category) => category.type === "income"),
  expense: categories.filter((category) => category.type !== "income"),
});

const getKeywordsForCategory = (category) => {
  const normalizedName = normalizeName(category?.name).toLowerCase();
  return keywordMap[normalizedName] || tokenizeName(category?.name);
};

const mergeCandidateCategories = (categories = []) => {
  const categoryMap = new Map();

  [...defaultCategorySuggestions, ...categories].forEach((category) => {
    const normalized = normalizeCategory(category);
    if (!normalized.name) return;

    const existing = categoryMap.get(normalized.name.toLowerCase()) || {};
    categoryMap.set(normalized.name.toLowerCase(), {
      ...existing,
      ...normalized,
    });
  });

  return Array.from(categoryMap.values());
};

export const detectCategorySuggestion = (description, categories = []) => {
  const normalizedDescription = normalizeText(description);
  const candidates = mergeCandidateCategories(categories);

  if (!normalizedDescription) {
    return normalizeCategory({ name: "Other", icon: "💰", type: "expense" });
  }

  let bestCandidate = null;
  let bestScore = 0;

  candidates.forEach((candidate) => {
    const keywords = getKeywordsForCategory(candidate);
    const nameMatch = normalizedDescription.includes(
      candidate.name.toLowerCase(),
    )
      ? 1
      : 0;
    const keywordScore = keywords.reduce((score, keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword) return score;
      return (
        score + (normalizedDescription.includes(normalizedKeyword) ? 1 : 0)
      );
    }, 0);
    const score = keywordScore * 2 + nameMatch;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  });

  if (!bestCandidate || bestScore <= 0) {
    return normalizeCategory({ name: "Other", icon: "💰", type: "expense" });
  }

  return {
    ...normalizeCategory(bestCandidate),
    score: bestScore,
  };
};

export const getCategoryMetaByName = (categoryName, categories = []) => {
  const normalizedName = normalizeName(categoryName);
  const category = categories.find(
    (item) =>
      normalizeName(item?.name).toLowerCase() === normalizedName.toLowerCase(),
  );

  return normalizeCategory(
    category ||
      defaultCategorySuggestions.find(
        (item) => item.name.toLowerCase() === normalizedName.toLowerCase(),
      ) || { name: normalizedName, type: "expense", icon: "💰" },
  );
};

export const filterCategorySuggestions = (query = "") => {
  const normalizedQuery = normalizeName(query).toLowerCase();

  return defaultCategorySuggestions
    .filter((category) => category.name.toLowerCase().includes(normalizedQuery))
    .map(normalizeCategory);
};
