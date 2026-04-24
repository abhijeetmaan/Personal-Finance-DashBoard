const ACCOUNT_META = {
  bank: { icon: "🏦", label: "Bank" },
  wallet: { icon: "👛", label: "Wallet" },
  investment: { icon: "📈", label: "Investment" },
};

const CARD_META = {
  credit: { icon: "💳", label: "Credit" },
  debit: { icon: "🪪", label: "Debit" },
};

const normalizeName = (value) => String(value || "").trim();

export const getAccountTypeMeta = (type) =>
  ACCOUNT_META[type] || ACCOUNT_META.bank;

export const getCardTypeMeta = (type) => CARD_META[type] || CARD_META.credit;

export const formatAccountLabel = (account) => {
  const meta = getAccountTypeMeta(account?.type);
  const icon = normalizeName(account?.icon) || meta.icon;
  return `${icon} ${normalizeName(account?.name) || "Account"}`;
};

export const formatCardLabel = (card) => {
  const meta = getCardTypeMeta(card?.type);
  const icon = normalizeName(card?.icon) || meta.icon;
  return `${icon} ${normalizeName(card?.name) || "Card"}`;
};

export const getDaysUntilDue = (dueDate) => {
  const now = new Date();
  const targetDay = Math.min(Math.max(Number(dueDate) || 1, 1), 31);
  let due = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), targetDay),
  );

  if (targetDay < now.getUTCDate()) {
    due = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, targetDay),
    );
  }

  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};
