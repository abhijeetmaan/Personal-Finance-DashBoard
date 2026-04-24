import apiClient from "../../../services/apiClient";

export const transactionService = {
  async createTransaction(payload) {
    const response = await apiClient.post("/transactions", payload);
    return response.data.data;
  },

  async getTransactions(params) {
    const response = await apiClient.get("/transactions", { params });
    return response.data.data;
  },

  async exportTransactionsCsv(params = {}) {
    const response = await apiClient.get("/transactions/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  async updateTransaction(id, payload) {
    const response = await apiClient.put(`/transactions/${id}`, payload);
    return response.data.data;
  },

  async deleteTransaction(id) {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  },
};
