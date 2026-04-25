const trimTrailingSlashes = (value) =>
  String(value || "").replace(/\/+$/, "");

const isDev = import.meta.env.MODE === "development";

const LOCAL_API_ORIGIN = "http://localhost:5002";

const productionOrigin =
  import.meta.env.VITE_API_URL?.trim() || LOCAL_API_ORIGIN;

/**
 * Backend origin only (no `/api/v1`).
 * - `vite` / MODE `development` → always local API on port 5002
 * - production build → `VITE_API_URL`, or localhost:5002 if unset
 */
export const API_BASE_URL = trimTrailingSlashes(
  isDev ? LOCAL_API_ORIGIN : productionOrigin,
);

export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

console.log("API BASE URL:", API_BASE_URL);

export function getBackendOrigin() {
  return API_BASE_URL;
}

export function getApiBaseUrl() {
  return API_V1_BASE_URL;
}
