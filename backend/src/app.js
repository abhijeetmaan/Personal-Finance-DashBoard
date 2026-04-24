import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: env.corsCredentials,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "personal-finance-dashboard-api",
  });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === "production" ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1", apiLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
