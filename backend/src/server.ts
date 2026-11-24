import "dotenv/config";
import express from "express";
import cors from "cors";

import { pool } from "./db/pool.js";
import companionRoutes from "./routes/companions.js";
import sessionRoutes from "./routes/sessions.js";
import stripeRoutes from "./routes/stripe.js";
import { stripeWebhook } from "./routes/stripe-webhook.js";
import voiceRoutes from "./routes/voice.js";
import { reconcileVoiceUsage } from "./services/voice-reconciliation.service.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

// Stripe requires the original raw request body
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());

// API routes
app.use("/api/companions", companionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/voice", voiceRoutes);

// Backend health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "KnowledgeHub-AI backend is running",
  });
});

// Database health check
app.get("/api/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "connected",
      database: "PostgreSQL",
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);

  void reconcileVoiceUsage();

  setInterval(() => {
    void reconcileVoiceUsage();
  }, 30000);
});