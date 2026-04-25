/**
 * HTTP server entry. CORS runs inside `app.js` (before JSON parser and routes).
 */
import dotenv from "dotenv";
import { createServer } from "node:http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { initSocket } from "./realtime/socket.js";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();
    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.port, () => {
      console.log(
        `API listening on port ${env.port} (${env.nodeEnv}) — health: /api/v1/health — CORS allowlist: ${env.corsAllowedOrigins.length} origins, vercel.app: ${env.corsAllowVercelSubdomains}`,
      );
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
