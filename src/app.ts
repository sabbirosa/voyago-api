import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./app/config/env";
import "./app/config/redis"; // Initialize Redis connection
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFoundHandler } from "./app/middlewares/notFound";
import healthRouter from "./app/modules/health/health.route";
import apiRouter from "./app/routes";

const app: Application = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth endpoints to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
});

// Trust proxy (important for production behind reverse proxy)
app.set("trust proxy", 1);

// Basic middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api/v1", limiter);
app.use("/api/v1/auth", authLimiter);

// Stripe webhook needs raw body for signature verification
// This must be applied BEFORE express.json() to ensure raw body is available
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

// JSON body parser - exclude webhook route to preserve raw body for signature verification
const jsonParser = express.json();
app.use((req, res, next) => {
  // Skip JSON parsing for webhook route (needs raw body for Stripe signature verification)
  if (req.path === "/api/v1/payments/webhook") {
    return next();
  }
  jsonParser(req, res, next);
});

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root route
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Voyago API is running...",
  });
});

// Health check route (comprehensive)
app.use("/health", healthRouter);

// Versioned API
app.use("/api/v1", apiRouter);

// Not found & error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
