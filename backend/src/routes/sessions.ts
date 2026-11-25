import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST /api/sessions
router.post("/", requireAuth, async (req, res) => {
  try {
    const { companionId } = req.body ?? {};
    const userId = res.locals.userId;

    if (
      typeof companionId !== "string" ||
      !uuidRegex.test(companionId)
    ) {
      return res.status(400).json({
        message: "Invalid companion ID",
      });
    }

    const result = await pool.query(
      `INSERT INTO session_history (companion_id, user_id)
       SELECT id, $2
       FROM companions
       WHERE id = $1
       RETURNING *`,
      [companionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Companion not found",
      });
    }

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Failed to save session:", error);

    res.status(500).json({
      message: "Failed to save session",
    });
  }
});

// GET /api/sessions/me
// GET /api/sessions/recent
// Both endpoints return only the authenticated user's sessions
router.get(["/me", "/recent"], requireAuth, async (req, res) => {
  try {
    const userId = res.locals.userId;
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "Invalid limit",
      });
    }

    const result = await pool.query(
      `SELECT c.*
       FROM session_history AS sh
       INNER JOIN companions AS c
       ON sh.companion_id = c.id
       WHERE sh.user_id = $1
       ORDER BY sh.created_at DESC, sh.id DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.set("Cache-Control", "private, no-store");
    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Failed to fetch user sessions:", error);

    res.status(500).json({
      message: "Failed to fetch user sessions",
    });
  }
});

export default router;