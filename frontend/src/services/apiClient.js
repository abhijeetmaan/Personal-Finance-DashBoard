import axios from "axios";
import { API_V1_BASE_URL } from "../config/api.js";

const apiClient = axios.create({
  baseURL: API_V1_BASE_URL,
  timeout: 10_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const dataMessage = error.response?.data?.message;
    const message =
      dataMessage ||
      (status === 403
        ? "API forbidden — check backend CLIENT_URL (CORS) and VITE_API_URL"
        : null) ||
      error.message ||
      "API request failed";

    if (import.meta.env.DEV) {
      const method = error.config?.method?.toUpperCase() ?? "REQ";
      const url = error.config?.url ?? "";
      console.error("[API]", method, url, message);
    }

    return Promise.reject(new Error(message));
  },
);

/** Alias matching common naming; same instance as default export. */
export const api = apiClient;

export default apiClient;
