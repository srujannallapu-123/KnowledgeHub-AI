import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const prices = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:3000";

// GET /api/stripe/subscription
router.get("/subscription", requireAuth, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const result = await pool.query(
      `SELECT plan, status, current_period_end,
              cancel_at_period_end
       FROM subscriptions
       WHERE user_id = $1`,
      [userId]
    );

    const subscription = result.rows[0];

    res.json(
      subscription || {
        plan: "free",
        status: "inactive",
        current_period_end: null,
        cancel_at_period_end: false,
      }
    );
  } catch (error) {
    console.error("Subscription error:", error);

    res.status(500).json({
      message: "Failed to fetch subscription",
    });
  }
});

// POST /api/stripe/checkout
router.post("/checkout", requireAuth, async (req, res) => {
  const client = await pool.connect().catch(() => null);

  if (!client) {
    return res.status(503).json({
      message: "Database unavailable",
    });
  }

  try {
    const userId = res.locals.userId;
    const { plan } = req.body ?? {};

    if (plan !== "pro" && plan !== "premium") {
      return res.status(400).json({
        message: "Invalid subscription plan",
      });
    }

    const priceId = prices[plan as keyof typeof prices];

    if (!priceId) {
      return res.status(500).json({
        message: "Stripe price is not configured",
      });
    }

    await client.query("BEGIN");

    // Lock user to avoid concurrent customer creation
    const userResult = await client.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    const subscriptionResult = await client.query(
      `SELECT *
       FROM subscriptions
       WHERE user_id = $1`,
      [userId]
    );

    const subscription = subscriptionResult.rows[0];

    let customerId = subscription?.stripe_customer_id;

    // Create Stripe customer if one does not exist
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: String(userId),
          },
        },
        {
          idempotencyKey: `knowledgehub-customer-${userId}`,
        }
      );

      customerId = customer.id;

      await client.query(
        `INSERT INTO subscriptions
           (user_id, stripe_customer_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET
           stripe_customer_id = EXCLUDED.stripe_customer_id,
           updated_at = NOW()`,
        [userId, customerId]
      );
    }

    await client.query("COMMIT");

    // Prevent additional subscriptions
    const existingSubscriptions =
      await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });

    const hasSubscription =
      existingSubscriptions.data.some(
        (item) =>
          item.status !== "canceled" &&
          item.status !== "incomplete_expired"
      );

    if (hasSubscription) {
      return res.status(409).json({
        message: "Manage your existing subscription instead",
      });
    }

    // Reuse an existing open Checkout session
    const openSessions =
      await stripe.checkout.sessions.list({
        customer: customerId,
        status: "open",
        limit: 10,
      });

    const existingSession = openSessions.data.find(
      (session) => session.mode === "subscription"
    );

    if (existingSession) {
      if (existingSession.metadata?.plan === plan) {
        return res.json({
          url: existingSession.url,
        });
      }

      await stripe.checkout.sessions.expire(
        existingSession.id
      );
    }

    const checkoutSession =
      await stripe.checkout.sessions.create({
        customer: customerId,

        mode: "subscription",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        client_reference_id: String(userId),

        metadata: {
          userId: String(userId),
          plan,
        },

        subscription_data: {
          metadata: {
            userId: String(userId),
            plan,
          },
        },

        success_url:
          `${frontendUrl}/subscription?success=true`,

        cancel_url:
          `${frontendUrl}/subscription?canceled=true`,
      });

    res.json({
      url: checkoutSession.url,
    });

  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Stripe checkout error:", error);

    res.status(500).json({
      message: "Failed to create checkout session",
    });
  } finally {
    client.release();
  }
});


// POST /api/stripe/portal
router.post("/portal", requireAuth, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const result = await pool.query(
      `SELECT stripe_customer_id
       FROM subscriptions
       WHERE user_id = $1`,
      [userId]
    );

    const customerId =
      result.rows[0]?.stripe_customer_id;

    if (!customerId) {
      return res.status(404).json({
        message: "No billing account found",
      });
    }

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${frontendUrl}/subscription`,
      });

    return res.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error("Stripe billing portal error:", error);

    return res.status(500).json({
      message: "Failed to open billing portal",
    });
  }
});

export default router;