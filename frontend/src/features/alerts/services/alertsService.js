import apiClient from "../../../services/apiClient";

export const alertsService = {
  async getAlerts({ month, year } = {}) {
    const response = await apiClient.get("/alerts", {
      params: { month, year },
    });
    return response.data.data;
  },
};
