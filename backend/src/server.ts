
import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js";
import companionRoutes from "./routes/companions.js";

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());

app.use("/api/companions", companionRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "KnowledgeHub-AI backend is running"
  });
});

app.get("/api/db-health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.status(200).json({
      status: "connected",
      database: "PostgreSQL",
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
