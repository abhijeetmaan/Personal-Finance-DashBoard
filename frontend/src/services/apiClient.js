import axios from "axios";
import { getApiBaseUrl } from "../config/api.js";

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      const method = error.config?.method?.toUpperCase() ?? "REQ";
      const url = error.config?.url ?? "";
      const message =
        error.response?.data?.message || error.message || "Request failed";
      console.error("[API]", method, url, message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
