import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import { getCompanionPermissions } from "./subscription.service.js";

type Plan = "free" | "pro" | "premium";

const VOICE_LIMITS: Record<
  Plan,
  {
    monthlySeconds: number;
    maxSessionSeconds: number;
  }
> = {
  free: {
    monthlySeconds: 5 * 60,
    maxSessionSeconds: 5 * 60,
  },
  pro: {
    monthlySeconds: 20 * 60,
    maxSessionSeconds: 15 * 60,
  },
  premium: {
    monthlySeconds: 45 * 60,
    maxSessionSeconds: 30 * 60,
  },
};

export async function getVoicePermissions(
  userId: number,
  db: PoolClient | typeof pool = pool
) {
  const { plan } = await getCompanionPermissions(
    userId,
    db
  );

  const limits = VOICE_LIMITS[plan];

  const usageResult = await db.query(
    `SELECT COALESCE(
       SUM(
         CASE
           WHEN status IN ('reserved', 'active')
             THEN reserved_seconds
           WHEN status = 'completed'
             THEN used_seconds
           ELSE 0
         END
       ), 0
     ) AS consumed_seconds
     FROM voice_usage
     WHERE user_id = $1
       AND (
         created_at >= (
           DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
           AT TIME ZONE 'UTC'
         )
         OR status IN ('reserved', 'active')
       )`,
    [userId]
  );

  const consumedSeconds = Number(
    usageResult.rows[0].consumed_seconds
  );

  const remainingSeconds = Math.max(
    0,
    limits.monthlySeconds - consumedSeconds
  );

  return {
    plan,
    monthlySeconds: limits.monthlySeconds,
    maxSessionSeconds: limits.maxSessionSeconds,
    consumedSeconds,
    remainingSeconds,
    canStartSession: remainingSeconds >= 60,
  };
}