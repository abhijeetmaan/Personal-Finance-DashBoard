import dotenv from "dotenv";

dotenv.config();

const mongoUri =
  process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim();

if (!mongoUri) {
  throw new Error(
    "Missing MONGO_URI or MONGODB_URI. Add your MongoDB connection string in Render → Environment.",
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri,
  clientUrl: process.env.CLIENT_URL?.trim() || "",
};

