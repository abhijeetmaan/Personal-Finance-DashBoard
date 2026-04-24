const trimTrailingSlashes = (value) => String(value || "").replace(/\/+$/, "");

/**
 * Backend origin only (no /api/v1). Prefer VITE_API_URL in production.
 * VITE_API_BASE_URL is supported for backwards compatibility when it includes /api/v1.
 */
export function getBackendOrigin() {
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
      // fall through to default
    }
  }

  return "http://localhost:5000";
}

export function getApiBaseUrl() {
  return `${getBackendOrigin()}/api/v1`;
}
