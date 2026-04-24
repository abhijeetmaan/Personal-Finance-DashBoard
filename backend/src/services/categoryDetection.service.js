const DEFAULT_CATEGORY_PROFILES = [
  {
    name: "Food",
    icon: "🍔",
    type: "expense",
    keywords: [
      "swiggy",
      "zomato",
      "restaurant",
      "cafe",
      "dinner",
      "lunch",
      "breakfast",
      "meal",
      "food",
    ],
  },
  {
    name: "Travel",
    icon: "🚗",
    type: "expense",
    keywords: [
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
  },
  {
    name: "Shopping",
    icon: "🛍️",
    type: "expense",
    keywords: [
      "amazon",
      "flipkart",
      "mall",
      "shopping",
      "purchase",
      "store",
      "myntra",
    ],
  },
  {
    name: "Bills",
    icon: "🧾",
    type: "expense",
    keywords: [
      "electricity",
      "water",
      "rent",
      "bill",
      "internet",
      "gas",
      "utility",
      "recharge",
    ],
  },
  {
    name: "Salary",
    icon: "💼",
    type: "income",
    keywords: ["salary", "payroll", "stipend", "paycheck", "wage"],
  },
  {
    name: "Freelance",
    icon: "💻",
    type: "income",
    keywords: ["freelance", "client", "invoice", "project", "contract"],
  },
  {
    name: "Other",
    icon: "💰",
    type: "expense",
    keywords: [],
  },
];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeName = (value) => String(value || "").trim();

const tokenizeName = (value) =>
  normalizeName(value).toLowerCase().split(/\s+/).filter(Boolean);

const buildProfile = (profile) => ({
  name: normalizeName(profile?.name),
  icon: String(profile?.icon || "").trim() || "💰",
  type: profile?.type === "income" ? "income" : "expense",
  keywords: Array.isArray(profile?.keywords) ? profile.keywords : [],
});

const scoreProfile = (text, profile) => {
  if (!text) return 0;

  const keywords =
    profile.keywords.length > 0 ? profile.keywords : tokenizeName(profile.name);
  const exactNameBonus = text.includes(normalizeText(profile.name)) ? 1 : 0;

  return (
    keywords.reduce((score, keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword) return score;
      return score + (text.includes(normalizedKeyword) ? 1 : 0);
    }, 0) + exactNameBonus
  );
};

const mergeProfiles = (profiles = []) => {
  const profileMap = new Map(
    DEFAULT_CATEGORY_PROFILES.map((profile) => [
      profile.name.toLowerCase(),
      buildProfile(profile),
    ]),
  );

  profiles.forEach((profile) => {
    const normalized = buildProfile(profile);
    if (!normalized.name) return;
    profileMap.set(normalized.name.toLowerCase(), {
      ...profileMap.get(normalized.name.toLowerCase()),
      ...normalized,
      keywords:
        profileMap.get(normalized.name.toLowerCase())?.keywords ||
        normalized.keywords,
    });
  });

  return Array.from(profileMap.values());
};

export const getDefaultCategoryProfiles = () =>
  DEFAULT_CATEGORY_PROFILES.map((profile) => ({ ...profile }));

export const resolveCategoryProfile = (categoryName, categoryDoc = null) => {
  const normalizedName = normalizeName(categoryName);
  const defaultProfile = DEFAULT_CATEGORY_PROFILES.find(
    (profile) => profile.name.toLowerCase() === normalizedName.toLowerCase(),
  );

  return {
    name: normalizedName,
    icon:
      String(categoryDoc?.icon || defaultProfile?.icon || "💰").trim() || "💰",
    type: categoryDoc?.type || defaultProfile?.type || "expense",
  };
};

export const detectCategorySuggestion = (description, categories = []) => {
  const normalizedText = normalizeText(description);
  const candidateProfiles = mergeProfiles(categories);

  if (!normalizedText) {
    return resolveCategoryProfile("Other");
  }

  let bestProfile = null;
  let bestScore = 0;

  candidateProfiles.forEach((profile) => {
    const score = scoreProfile(normalizedText, profile);
    if (score > bestScore) {
      bestScore = score;
      bestProfile = profile;
    }
  });

  if (!bestProfile || bestScore <= 0) {
    return resolveCategoryProfile("Other");
  }

  return {
    ...resolveCategoryProfile(bestProfile.name, bestProfile),
    score: bestScore,
  };
};

export const getCategoryMetaByName = (categoryName, categories = []) => {
  const normalizedName = normalizeName(categoryName);
  const categoryDoc = categories.find(
    (item) =>
      normalizeName(item?.name).toLowerCase() === normalizedName.toLowerCase(),
  );

  return resolveCategoryProfile(normalizedName, categoryDoc);
};
