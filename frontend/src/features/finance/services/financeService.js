import apiClient from "../../../services/apiClient";

export const financeService = {
  async getSummary(params = {}) {
    const response = await apiClient.get("/finance/summary", { params });
    return response.data.data;
  },
};
