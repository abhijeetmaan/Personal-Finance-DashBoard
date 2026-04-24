import apiClient from "../../../services/apiClient";

export const insightsService = {
  async getExpenseInsights({ month, year } = {}) {
    const response = await apiClient.get("/insights/expenses", {
      params: { month, year },
    });
    return response.data.data;
  },

  async getSpendingComparison({ month, year } = {}) {
    const response = await apiClient.get("/insights/comparison", {
      params: { month, year },
    });
    return response.data.data;
  },
};
