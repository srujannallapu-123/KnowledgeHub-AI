import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";

type Plan = "free" | "pro" | "premium";

const COMPANION_LIMITS: Record<Plan, number | null> = {
  free: 3,
  pro: 10,
  premium: null,
};

export async function getCompanionPermissions(
  userId: number,
  db: PoolClient | typeof pool = pool
) {
  const subscriptionResult = await db.query(
    `SELECT plan
     FROM subscriptions
     WHERE user_id = $1
       AND status IN ('active', 'trialing')
       AND current_period_end > NOW()`,
    [userId]
  );

  const subscriptionPlan =
    subscriptionResult.rows[0]?.plan;

  const plan: Plan =
    subscriptionPlan === "pro" ||
    subscriptionPlan === "premium"
      ? subscriptionPlan
      : "free";

  const countResult = await db.query(
    `SELECT COUNT(*) AS count
     FROM companions
     WHERE author = $1`,
    [userId]
  );

  const currentCount = Number(
    countResult.rows[0].count
  );

  const limit = COMPANION_LIMITS[plan];

  return {
    plan,
    currentCount,
    limit,
    remaining:
      limit === null
        ? null
        : Math.max(0, limit - currentCount),
    canCreate:
      limit === null || currentCount < limit,
  };
}