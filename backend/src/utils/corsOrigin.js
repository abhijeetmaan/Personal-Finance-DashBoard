/**
 * Express `cors` origin callback: echo the request `Origin` when allowed
 * (required for `credentials: true` — must not use `*`).
 */
export function createCorsOriginCallback(allowedOrigins, { allowVercelSubdomains }) {
  const normalized = new Set(
    allowedOrigins.map((o) => String(o).trim().replace(/\/+$/, "")),
  );

  return function corsOrigin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const trimmed = origin.trim().replace(/\/+$/, "");
    if (normalized.has(trimmed)) {
      return callback(null, origin);
    }

    if (allowVercelSubdomains) {
      try {
        const { hostname } = new URL(origin);
        if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) {
          return callback(null, origin);
        }
      } catch {
        /* ignore */
      }
    }

    console.warn(`[CORS] Blocked Origin: ${origin}`);
    return callback(null, false);
  };
}
