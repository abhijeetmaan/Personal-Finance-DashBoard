import apiClient from "../../../services/apiClient";

export const reportsService = {
  async getPnl(params = {}) {
    const response = await apiClient.get("/reports/pnl", { params });
    return response.data.data;
  },

  async getCashflow(params = {}) {
    const response = await apiClient.get("/reports/cashflow", { params });
    return response.data.data;
  },
};
