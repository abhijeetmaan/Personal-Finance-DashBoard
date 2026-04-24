const trimTrailingSlashes = (value) => String(value || "").replace(/\/+$/, "");

/**
 * Backend origin only (no `/api/v1`). Set `VITE_API_URL` in `.env` or on Vercel.
 * Legacy: `VITE_API_BASE_URL` may include `/api/v1`; we normalize to origin.
 */
function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlashes(fromEnv);
  }

  const legacy = import.meta.env.VITE_API_BASE_URL?.trim();
  if (legacy) {
    try {
      const url = new URL(
        legacy.startsWith("http") ? legacy : `http://${legacy}`,
      );
      let path = url.pathname.replace(/\/+$/, "") || "";
      if (path.endsWith("/api/v1")) {
        path = path.slice(0, -"/api/v1".length) || "";
      }
      const basePath = path && path !== "/" ? path : "";
      return trimTrailingSlashes(`${url.origin}${basePath}`);
    } catch {
      // fall through
    }
  }

  return "http://localhost:5000";
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Use for REST paths: `${API_V1_BASE_URL}/transactions` or axios baseURL. */
export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

export function getBackendOrigin() {
  return API_BASE_URL;
}

export function getApiBaseUrl() {
  return API_V1_BASE_URL;
}
