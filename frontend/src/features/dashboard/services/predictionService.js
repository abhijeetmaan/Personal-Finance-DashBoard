// HTTP base: src/config/api.js → apiClient (never relative /api/v1 URLs)
import apiClient from "../../../services/apiClient";

export const predictionService = {
  async getPrediction() {
    const response = await apiClient.get("/predictions/next-month");
    return response.data.data;
  },

  async getCategoryPredictions() {
    const response = await apiClient.get("/prediction/categories");
    return response.data.data;
  },
};
