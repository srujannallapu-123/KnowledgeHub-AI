
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// GET /api/companions
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, subject, topic, voice,
              style, duration, author, created_at
       FROM companions
       ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to fetch companions:", error);

    res.status(500).json({
      message: "Failed to fetch companions",
    });
  }
});




router.post("/", async (req, res) => {
  try {
    const {
      name,
      subject,
      topic,
      voice,
      style,
      duration,
      author,
    } = req.body;

    // Validate the incoming data
    if (
      typeof name !== "string" || !name.trim() ||
      typeof subject !== "string" || !subject.trim() ||
      typeof topic !== "string" || !topic.trim() ||
      typeof voice !== "string" || !voice.trim() ||
      typeof style !== "string" || !style.trim() ||
      !Number.isInteger(duration) || duration <= 0 ||
      typeof author !== "string" || !author.trim()
    ) {
      return res.status(400).json({
        message: "Invalid or missing companion fields",
      });
    }

    const result = await pool.query(
      `INSERT INTO companions
        (name, subject, topic, voice, style, duration, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, subject, topic, voice, style, duration, author]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create companion:", error);

    res.status(500).json({
      message: "Failed to create companion",
    });
  }
});




router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM companions WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Companion not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch companion:", error);

    res.status(500).json({
      message: "Failed to fetch companion",
    });
  }
});



router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, topic, duration } = req.body;

    // Validate UUID before querying PostgreSQL
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id as string)) {
      return res.status(400).json({
        message: "Invalid companion ID",
      });
    }

    if (
      typeof name !== "string" || !name.trim() ||
      typeof topic !== "string" || !topic.trim() ||
      !Number.isInteger(duration) || duration <= 0
    ) {
      return res.status(400).json({
        message: "Valid name, topic and duration are required",
      });
    }

    const result = await pool.query(
      `UPDATE companions
       SET name = $1, topic = $2, duration = $3
       WHERE id = $4
       RETURNING *`,
      [name.trim(), topic.trim(), duration, id]
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




router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the companion ID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id as string)) {
      return res.status(400).json({
        message: "Invalid companion ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM companions WHERE id = $1 RETURNING id",
      [id]
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


