export const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

export const formatDateTime = (dateValue) => {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleString();
};
