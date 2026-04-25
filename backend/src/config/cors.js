/**
 * Express + Socket.IO CORS with credentials.
 * Reflects the request Origin when allowed (never Access-Control-Allow-Origin: *).
 */
export function createCorsOptions({
  allowedOrigins,
  allowVercelSubdomains,
}) {
  const normalized = new Set(
    allowedOrigins.map((o) => String(o).trim().replace(/\/+$/, "")),
  );

  const origin = (requestOrigin, callback) => {
    if (!requestOrigin) {
      return callback(null, true);
    }

    const trimmed = requestOrigin.trim().replace(/\/+$/, "");
    if (normalized.has(trimmed)) {
      console.log("Allowed origin:", requestOrigin);
      return callback(null, requestOrigin);
    }

    if (allowVercelSubdomains) {
      try {
        const { hostname } = new URL(requestOrigin);
        if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) {
          console.log("Allowed origin:", requestOrigin);
          return callback(null, requestOrigin);
        }
      } catch {
        /* ignore */
      }
    }

    console.warn("[CORS] Not allowed by CORS:", requestOrigin);
    return callback(null, false);
  };

  return {
    origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: [],
    optionsSuccessStatus: 204,
  };
}
