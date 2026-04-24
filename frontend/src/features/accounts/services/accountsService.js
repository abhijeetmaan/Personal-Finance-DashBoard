import apiClient from "../../../services/apiClient";

export const accountsService = {
  async getAccounts(params = {}) {
    const response = await apiClient.get("/accounts", { params });
    return response.data.data;
  },

  async getSummary(params = {}) {
    const response = await apiClient.get("/accounts/summary", { params });
    return response.data.data;
  },

  async transfer(payload) {
    const response = await apiClient.post("/accounts/transfer", payload);
    return response.data.data;
  },

  async createAccount(payload) {
    const response = await apiClient.post("/accounts", payload);
    return response.data.data;
  },

  async deleteAccount(id, params = {}) {
    const response = await apiClient.patch(`/accounts/${id}/delete`, null, {
      params,
    });
    return response.data.data;
  },
};
