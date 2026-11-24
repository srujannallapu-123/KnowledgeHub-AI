
import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { getVoicePermissions } from "../services/voice-usage.service.js";
import {
  createVapiCall,
  getVoiceId,
  VapiRequestError,
} from "../services/vapi.service.js";

const router = Router();

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Get the user's voice usage permissions
router.get("/permissions", requireAuth, async (req, res) => {
  try {
    const userId = Number(res.locals.userId);

    const permissions = await getVoicePermissions(userId);

    return res.status(200).json(permissions);
  } catch (error) {
    console.error("Voice permissions error:", error);

    return res.status(500).json({
      message: "Unable to retrieve voice permissions",
    });
  }
});

// Create a secure voice session
router.post("/call/web", requireAuth, async (req, res) => {
  const userId = Number(res.locals.userId);

  // Only accept the companion ID from the SDK request
  const companionId = req.body?.assistantId;

  if (
    typeof companionId !== "string" ||
    !uuidRegex.test(companionId)
  ) {
    return res.status(400).json({
      message: "Invalid companion ID",
    });
  }

  if (!process.env.VAPI_PRIVATE_API_KEY) {
    return res.status(503).json({
      message: "Voice service is unavailable",
    });
  }

  let client;

  try {
    client = await pool.connect();
  } catch {
    return res.status(503).json({
      message: "Database unavailable",
    });
  }

  let reservationId: string;
  let durationSeconds: number;
  let companion;

  try {
    await client.query("BEGIN");

    // Prevent simultaneous quota bypass
    const userResult = await client.query(
      `SELECT id FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        message: "User not found",
      });
    }

    await client.query(
      `SELECT user_id FROM subscriptions
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    // Retrieve trusted companion configuration
    const companionResult = await client.query(
      `SELECT id, subject, topic, voice, style, duration
       FROM companions
       WHERE id = $1`,
      [companionId]
    );

    if (companionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Companion not found",
      });
    }

    companion = companionResult.rows[0];

    const permissions = await getVoicePermissions(
      userId,
      client
    );

    if (!permissions.canStartSession) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        message: "Your monthly voice allowance has been reached.",
        permissions,
      });
    }

    // Enforce the smallest permitted duration
    durationSeconds = Math.min(
      Number(companion.duration) * 60,
      permissions.maxSessionSeconds,
      permissions.remainingSeconds
    );

    if (
      !Number.isInteger(durationSeconds) ||
      durationSeconds < 60
    ) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        message: "Insufficient voice minutes remaining",
      });
    }

    // Reserve minutes before contacting Vapi
    const reservation = await client.query(
      `INSERT INTO voice_usage (
         user_id,
         companion_id,
         reserved_seconds,
         status
       )
       VALUES ($1, $2, $3, 'reserved')
       RETURNING id`,
      [userId, companionId, durationSeconds]
    );

    reservationId = reservation.rows[0].id;

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Voice reservation failed:", error);

    return res.status(500).json({
      message: "Unable to reserve voice minutes",
    });
  } finally {
    client.release();
  }

  try {
    // Create the call using server-controlled configuration
    const call = await createVapiCall({
      subject: companion.subject,
      topic: companion.topic,
      style: companion.style,
      voiceId: getVoiceId(
        companion.voice,
        companion.style
      ),
      durationSeconds,
    });

    await pool.query(
      `UPDATE voice_usage
       SET vapi_call_id = $1,
           status = 'active'
       WHERE id = $2`,
      [call.id, reservationId]
    );

    return res.status(201).json(call);
  } catch (error) {
    console.error(
      "Voice call creation failed. Reservation:",
      reservationId,
      error
    );

    // Release minutes if Vapi definitively rejected the request
    if (
      error instanceof VapiRequestError &&
      error.isDefinitiveRejection
    ) {
      try {
        const result = await pool.query(
          `UPDATE voice_usage
           SET status = 'failed',
               ended_at = NOW()
           WHERE id = $1
           AND status = 'reserved'
           AND vapi_call_id IS NULL`,
          [reservationId]
        );

        if (result.rowCount === 1) {
          console.log(
            "Voice reservation released:",
            reservationId
          );
        }
      } catch (releaseError) {
        console.error(
          "Failed to release voice reservation:",
          releaseError
        );
      }
    }

    // Retain reservations for uncertain failures because
    // a timed-out request might have created a remote call.

    return res.status(502).json({
      message: "Unable to start voice session",
    });
  }
});

export default router;
