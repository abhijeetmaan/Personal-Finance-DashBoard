import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { createCorsOptions } from "./config/cors.js";
import alertsRoutes from "./routes/alerts.routes.js";
import accountsRoutes from "./routes/accounts.routes.js";
import cardsRoutes from "./routes/cards.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import predictionRoutes from "./routes/prediction.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const corsOptions = createCorsOptions({
  allowedOrigins: env.corsAllowedOrigins,
  allowVercelSubdomains: env.corsAllowVercelSubdomains,
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true });
});

app.use("/api/v1/transactions", apiLimiter, transactionRoutes);
app.use("/api/v1/accounts", apiLimiter, accountsRoutes);
app.use("/api/v1/cards", apiLimiter, cardsRoutes);
app.use("/api/v1/finance", apiLimiter, financeRoutes);
app.use("/api/v1/categories", apiLimiter, categoriesRoutes);
app.use("/api/v1/alerts", apiLimiter, alertsRoutes);
app.use("/api/v1/budget", apiLimiter, budgetRoutes);
app.use("/api/v1/analytics", apiLimiter, analyticsRoutes);
app.use("/api/v1/reports", apiLimiter, reportsRoutes);
app.use("/api/v1/insights", apiLimiter, insightsRoutes);
app.use("/api/v1/prediction", apiLimiter, predictionRoutes);
app.use("/api/v1/predictions", apiLimiter, predictionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
