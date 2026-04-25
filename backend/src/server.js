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
      const corsNote =
        env.corsOrigins === "*"
          ? "CORS: *"
          : `CORS: ${env.corsOrigins.length} allowlist + vercel.app=${env.corsAllowVercelSubdomains}`;
      console.log(
        `API listening on port ${env.port} (${env.nodeEnv}) — health: /api/v1/health — ${corsNote}`,
      );
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
