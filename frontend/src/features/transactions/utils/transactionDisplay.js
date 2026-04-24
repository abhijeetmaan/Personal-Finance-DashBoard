import { getCategoryMetaByName } from "../../budget/utils/categoryCatalog";

export const getTransactionCategoryDisplay = (transaction) => {
  const name = String(transaction?.category || "").trim() || "Other";
  return getCategoryMetaByName(name, []);
};

const isTransferLike = (transaction) => {
  const cat = String(transaction?.category || "").toLowerCase();
  const src = String(transaction?.source || "").toLowerCase();
  return (
    cat === "transfer" ||
    src.includes("transfer") ||
    src === "account-transfer"
  );
};

export const getTransactionSourceTags = (transaction) => {
  const tags = [];

  if (isTransferLike(transaction)) {
    tags.push({ key: "transfer", label: "Transfer" });
  }

  if (transaction?.cardId) {
    tags.push({ key: "card", label: "Card" });
  }

  if (transaction?.accountId) {
    tags.push({ key: "bank", label: "Bank" });
  }

  if (!tags.length) {
    tags.push({ key: "unassigned", label: "Unassigned" });
  }

  return tags;
};
