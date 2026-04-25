import axios from "axios";
import { API_V1_BASE_URL } from "../config/api.js";

/**
 * All REST calls use `API_V1_BASE_URL` (see `src/config/api.js`) via this instance.
 * Feature services should import `apiClient` here — not raw URLs.
 */
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
        ? "API forbidden — set Render CLIENT_URL to your Vercel origin and redeploy backend"
        : null) ||
      (status === 404 ? "API request failed — not found" : null) ||
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

export const api = apiClient;

export default apiClient;
