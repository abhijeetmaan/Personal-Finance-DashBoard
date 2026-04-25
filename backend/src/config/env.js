import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

const mongoUri =
  process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim();

if (!mongoUri) {
  throw new Error(
    "Missing MONGO_URI or MONGODB_URI. Add your MongoDB connection string in Render → Environment.",
  );
}

const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const fromEnv = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
  process.env.CORS_EXTRA_ORIGINS,
]
  .filter(Boolean)
  .flatMap((raw) => raw.split(","))
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter((s) => s && s !== "*");

if (
  [process.env.CLIENT_URL, process.env.CORS_ORIGIN, process.env.CORS_EXTRA_ORIGINS]
    .filter(Boolean)
    .some((raw) => raw.split(",").some((p) => p.trim() === "*"))
) {
  console.warn(
    "[CORS] Wildcard * in CLIENT_URL/CORS_ORIGIN is ignored when using credentials.",
  );
}

const corsAllowedOrigins = [...new Set([...defaultCorsOrigins, ...fromEnv])];

const corsAllowVercelSubdomains =
  process.env.CORS_ALLOW_VERCEL_SUBDOMAINS !== "0";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  mongoUri,
  corsAllowedOrigins,
  corsAllowVercelSubdomains,
};
