
require("dotenv").config();

const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const API_URL = "http://127.0.0.1:5000/api";

let userId;
let token;

async function request(
  path,
  method = "GET",
  body,
  authenticated = true
) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return {
    status: response.status,
    data: await response.json(),
  };
}

async function setPlan(plan, expired = false) {
  await pool.query(
    `INSERT INTO subscriptions
       (user_id, plan, status, current_period_end)
     VALUES ($1, $2, 'active', $3)
     ON CONFLICT (user_id)
     DO UPDATE SET
       plan = EXCLUDED.plan,
       status = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end`,
    [
      userId,
      plan,
      new Date(
        Date.now() + (expired ? -86400000 : 86400000)
      ),
    ]
  );
}

async function createCompanion() {
  return request("/companions", "POST", {
    name: "Subscription Test Companion",
    subject: "science",
    topic: "Testing",
    voice: "female",
    style: "casual",
    duration: 5,
  });
}

async function expectCreation(expectedStatus, label) {
  const result = await createCompanion();

  assert.equal(
    result.status,
    expectedStatus,
    JSON.stringify(result.data)
  );

  console.log(`PASS: ${label}`);
}

async function test() {
  // Only run against the local development database.
  const database = new URL(process.env.DATABASE_URL);

  if (
    !["localhost", "127.0.0.1"].includes(
      database.hostname
    ) ||
    database.pathname !== "/knowledgehub_db"
  ) {
    throw new Error("Local test database required");
  }

  if (!process.env.API_JWT_SECRET) {
    throw new Error("Missing API_JWT_SECRET");
  }

  const result = await pool.query(
    `INSERT INTO users (name, email)
     VALUES ($1, $2)
     RETURNING id`,
    [
      "Subscription Test User",
      `test-${crypto.randomUUID()}@example.com`,
    ]
  );

  userId = result.rows[0].id;

  token = jwt.sign(
    {},
    process.env.API_JWT_SECRET,
    {
      algorithm: "HS256",
      subject: String(userId),
      issuer: "knowledgehub-frontend",
      audience: "knowledgehub-backend",
      expiresIn: "15m",
    }
  );

  // FREE PLAN
  console.log("\nTesting Free plan...");

  for (let i = 1; i <= 3; i++) {
    await expectCreation(
      201,
      `Free companion ${i} created`
    );
  }

  await expectCreation(
    403,
    "Free fourth companion blocked"
  );

  // PRO PLAN
  console.log("\nTesting Pro plan...");

  await setPlan("pro");

  for (let i = 4; i <= 10; i++) {
    await expectCreation(
      201,
      `Pro companion ${i} created`
    );
  }

  await expectCreation(
    403,
    "Pro eleventh companion blocked"
  );

  // PREMIUM PLAN
  console.log("\nTesting Premium plan...");

  await setPlan("premium");

  await expectCreation(
    201,
    "Premium eleventh companion created"
  );

  const permissions = await request(
    "/companions/permissions"
  );

  assert.equal(permissions.status, 200);
  assert.equal(permissions.data.plan, "premium");
  assert.equal(permissions.data.limit, null);
  assert.equal(permissions.data.canCreate, true);

  console.log("PASS: Premium unlimited permissions");

  // EXPIRED SUBSCRIPTION
  console.log("\nTesting expired subscription...");

  await setPlan("premium", true);

  const expired = await request(
    "/companions/permissions"
  );

  assert.equal(expired.status, 200);
  assert.equal(expired.data.plan, "free");
  assert.equal(expired.data.limit, 3);
  assert.equal(expired.data.canCreate, false);

  await expectCreation(
    403,
    "Expired subscription falls back to Free"
  );

  // UNAUTHENTICATED REQUEST
  console.log("\nTesting authentication...");

  const unauthorized = await request(
    "/companions",
    "POST",
    {},
    false
  );

  assert.equal(unauthorized.status, 401);

  console.log("PASS: Unauthenticated request blocked");

  console.log("\nALL SUBSCRIPTION TESTS PASSED");
}

test()
  .catch((error) => {
    console.error("TEST FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (userId) {
        await pool.query(
          "DELETE FROM companions WHERE author = $1",
          [userId]
        );

        await pool.query(
          "DELETE FROM subscriptions WHERE user_id = $1",
          [userId]
        );

        await pool.query(
          "DELETE FROM users WHERE id = $1",
          [userId]
        );

        console.log("Temporary test data removed");
      }
    } catch (error) {
      console.error("Cleanup failed:", error.message);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });
