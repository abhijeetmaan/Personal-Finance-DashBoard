import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

const requiredEnvVars = ["MONGO_URI"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const rawClientUrl =
  process.env.CLIENT_URL?.trim() || process.env.CORS_ORIGIN?.trim();

let corsOrigins;
let corsCredentials;

if (rawClientUrl === "*") {
  corsOrigins = "*";
  corsCredentials = false;
} else if (rawClientUrl) {
  corsOrigins = rawClientUrl
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  corsCredentials = true;
} else if (nodeEnv !== "production") {
  corsOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
  corsCredentials = true;
} else {
  throw new Error(
    "CLIENT_URL must be set in production (e.g. https://your-app.vercel.app). Use a comma-separated list for multiple origins.",
  );
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  corsOrigins,
  corsCredentials,
};
