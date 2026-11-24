
import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { getCompanionPermissions } from "../services/subscription.service.js";

const router = Router();

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET /api/companions
router.get("/", async (req, res) => {
  try {
    const subject =
      typeof req.query.subject === "string"
        ? req.query.subject
        : "";

    const topic =
      typeof req.query.topic === "string"
        ? req.query.topic
        : "";

    const limit = Number(req.query.limit ?? 10);
    const page = Number(req.query.page ?? 1);

    if (
      !Number.isInteger(limit) ||
      !Number.isInteger(page) ||
      limit < 1 ||
      limit > 100 ||
      page < 1 ||
      page > 10000
    ) {
      return res.status(400).json({
        message: "Invalid pagination parameters",
      });
    }

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, name, subject, topic, voice,
              style, duration, author, created_at
       FROM companions
       WHERE ($1 = '' OR subject ILIKE '%' || $1 || '%')
       AND ($2 = '' OR topic ILIKE '%' || $2 || '%'
                    OR name ILIKE '%' || $2 || '%')
       ORDER BY created_at DESC, id DESC
       LIMIT $3 OFFSET $4`,
      [subject, topic, limit, offset]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to fetch companions:", error);

    return res.status(500).json({
      message: "Failed to fetch companions",
    });
  }
});

// GET /api/companions/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const result = await pool.query(
      `SELECT * FROM companions
       WHERE author = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to fetch user companions:", error);

    return res.status(500).json({
      message: "Failed to fetch user companions",
    });
  }
});

// GET /api/companions/permissions
router.get("/permissions", requireAuth, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const permissions =
      await getCompanionPermissions(userId);

    return res.status(200).json(permissions);
  } catch (error) {
    console.error("Failed to check permissions:", error);

    return res.status(500).json({
      message: "Failed to check companion permissions",
    });
  }
});

// POST /api/companions
router.post("/", requireAuth, async (req, res) => {
  const { name, subject, topic, voice, style, duration } =
    req.body ?? {};

  const author = res.locals.userId;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof subject !== "string" || !subject.trim() ||
    typeof topic !== "string" || !topic.trim() ||
    typeof voice !== "string" || !voice.trim() ||
    typeof style !== "string" || !style.trim() ||
    !Number.isInteger(duration) ||
    duration <= 0 || duration > 2147483647
  ) {
    return res.status(400).json({
      message: "Invalid or missing companion fields",
    });
  }

  const client = await pool.connect().catch(() => null);

  if (!client) {
    return res.status(503).json({
      message: "Database unavailable",
    });
  }

  try {
    await client.query("BEGIN");

    // Prevent concurrent creation requests from
    // bypassing the user's subscription limit.
    const userResult = await client.query(
      `SELECT id FROM users
       WHERE id = $1
       FOR UPDATE`,
      [author]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        message: "User not found",
      });
    }

    // Coordinate with subscription webhook updates.
    await client.query(
      `SELECT user_id FROM subscriptions
       WHERE user_id = $1
       FOR UPDATE`,
      [author]
    );

    const permissions =
      await getCompanionPermissions(author, client);

    if (!permissions.canCreate) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        message:
          `You have reached your ${permissions.plan} plan ` +
          `limit of ${permissions.limit} companions. ` +
          "Upgrade your subscription or delete an existing companion.",
        permissions,
      });
    }

    const result = await client.query(
      `INSERT INTO companions
        (name, subject, topic, voice, style, duration, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name.trim(),
        subject.trim(),
        topic.trim(),
        voice.trim(),
        style.trim(),
        duration,
        author,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Failed to create companion:", error);

    return res.status(500).json({
      message: "Failed to create companion",
    });
  } finally {
    client.release();
  }
});

// GET /api/companions/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidRegex.test(id as string)) {
      return res.status(400).json({
        message: "Invalid companion ID",
      });
    }

    const result = await pool.query(
      "SELECT * FROM companions WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Companion not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch companion:", error);

    return res.status(500).json({
      message: "Failed to fetch companion",
    });
  }
});

// PATCH /api/companions/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, topic, duration } = req.body ?? {};
    const userId = res.locals.userId;

    if (!uuidRegex.test(id as string)) {
      return res.status(400).json({
        message: "Invalid companion ID",
      });
    }

    if (
      typeof name !== "string" || !name.trim() ||
      typeof topic !== "string" || !topic.trim() ||
      !Number.isInteger(duration) ||
      duration <= 0 || duration > 2147483647
    ) {
      return res.status(400).json({
        message: "Valid name, topic and duration are required",
      });
    }

    const result = await pool.query(
      `UPDATE companions
       SET name = $1, topic = $2, duration = $3
       WHERE id = $4 AND author = $5
       RETURNING *`,
      [name.trim(), topic.trim(), duration, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Companion not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update companion:", error);

    return res.status(500).json({
      message: "Failed to update companion",
    });
  }
});

// DELETE /api/companions/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = res.locals.userId;

    if (!uuidRegex.test(id as string)) {
      return res.status(400).json({
        message: "Invalid companion ID",
      });
    }

    const result = await pool.query(
      `DELETE FROM companions
       WHERE id = $1 AND author = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Companion not found",
      });
    }

    return res.status(200).json({
      message: "Companion deleted successfully",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Failed to delete companion:", error);

    return res.status(500).json({
      message: "Failed to delete companion",
    });
  }
});

export default router;
