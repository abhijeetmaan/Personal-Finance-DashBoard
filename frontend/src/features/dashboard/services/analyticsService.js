import apiClient from "../../../services/apiClient";

export const analyticsService = {
  async getTopCategory(params = {}) {
    const response = await apiClient.get("/analytics/top-category", { params });
    return response.data.data;
  },

  async getNetBalance(params = {}) {
    const response = await apiClient.get("/analytics/net-balance", { params });
    return response.data.data;
  },

  async getNetWorth(params = {}) {
    const response = await apiClient.get("/analytics/net-worth", { params });
    return response.data.data;
  },

  async getNetWorthTrend(params = {}) {
    const response = await apiClient.get("/analytics/net-worth-trend", {
      params,
    });
    return response.data.data;
  },
};
