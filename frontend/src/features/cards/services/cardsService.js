import apiClient from "../../../services/apiClient";

export const cardsService = {
  async getCards(params = {}) {
    const response = await apiClient.get("/cards", { params });
    return response.data.data;
  },

  async createCard(payload) {
    const response = await apiClient.post("/cards", payload);
    return response.data.data;
  },

  async payBill(payload) {
    const response = await apiClient.post("/cards/pay-bill", payload);
    return response.data.data;
  },

  async getCardBill(id, params = {}) {
    const response = await apiClient.get(`/cards/${id}/bill`, { params });
    return response.data.data;
  },

  async deleteCard(id, params = {}) {
    const response = await apiClient.patch(`/cards/${id}/delete`, null, {
      params,
    });
    return response.data.data;
  },
};
