import { pool } from "../db/pool.js";

let isReconciling = false;

export async function reconcileVoiceUsage() {
  if (isReconciling) return;

  const apiKey = process.env.VAPI_PRIVATE_API_KEY;

  if (!apiKey) {
    console.error("VAPI_PRIVATE_API_KEY is missing");
    return;
  }

  isReconciling = true;

  try {
    const result = await pool.query(`
      SELECT id, vapi_call_id, reserved_seconds
      FROM voice_usage
      WHERE status = 'active'
      AND vapi_call_id IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 50
    `);

    for (const reservation of result.rows) {
      try {
        const response = await fetch(
          `https://api.vapi.ai/call/${encodeURIComponent(
            reservation.vapi_call_id
          )}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!response.ok) {
          console.error(
            "Vapi reconciliation failed:",
            response.status
          );
          continue;
        }

        const call = await response.json();

        if (call.status !== "ended") continue;

        if (!call.startedAt || !call.endedAt) {
          continue;
        }

        const startedAt = new Date(
          call.startedAt
        ).getTime();

        const endedAt = new Date(
          call.endedAt
        ).getTime();

        if (
          !Number.isFinite(startedAt) ||
          !Number.isFinite(endedAt) ||
          endedAt < startedAt
        ) {
          continue;
        }

        const usedSeconds = Math.ceil(
          (endedAt - startedAt) / 1000
        );

        const updated = await pool.query(
          `
          UPDATE voice_usage
          SET
            used_seconds = $1,
            status = 'completed',
            ended_at = $2
          WHERE id = $3
          AND status = 'active'
          `,
          [
            usedSeconds,
            call.endedAt,
            reservation.id,
          ]
        );

        if (updated.rowCount === 1) {
          console.log("Voice usage reconciled:", {
            reservedSeconds:
              reservation.reserved_seconds,
            usedSeconds,
            releasedSeconds: Math.max(
              0,
              reservation.reserved_seconds -
                usedSeconds
            ),
          });
        }
      } catch (error) {
        console.error(
          "Unable to reconcile voice session:",
          reservation.id,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "Voice reconciliation error:",
      error
    );
  } finally {
    isReconciling = false;
  }
}