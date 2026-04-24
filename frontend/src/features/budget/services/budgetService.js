import apiClient from "../../../services/apiClient";

export const budgetService = {
  async getCategories(params = {}) {
    const response = await apiClient.get("/categories", { params });
    return response.data.data;
  },

  async createCategory(payload) {
    const response = await apiClient.post("/categories", payload);
    return response.data.data;
  },

  async deleteCategory(id, params = {}) {
    const response = await apiClient.delete(`/categories/${id}`, { params });
    return response.data;
  },

  async getBudget(params = {}) {
    const response = await apiClient.get("/budget", { params });
    return response.data.data;
  },

  async getBudgetSuggestions(params = {}) {
    const response = await apiClient.get("/budget/suggestions", { params });
    return response.data.data;
  },

  async getBudgetAlerts(params = {}) {
    const response = await apiClient.get("/budget/alerts", { params });
    return response.data.data;
  },

  async setBudget(payload) {
    const response = await apiClient.post("/budget", payload);
    return response.data.data;
  },
};
