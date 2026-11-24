import type { Request, Response } from "express";
import type Stripe from "stripe";

import { stripe } from "../config/stripe.js";
import { pool } from "../db/pool.js";

export async function stripeWebhook(
  req: Request,
  res: Response
) {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (typeof signature !== "string" || !webhookSecret) {
    return res.status(400).json({
      message: "Missing webhook signature or secret",
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);

    return res.status(400).json({
      message: "Invalid webhook signature",
    });
  }

  const supportedEvents = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  if (!supportedEvents.includes(event.type)) {
    return res.status(200).json({ received: true });
  }

  const client = await pool.connect().catch(() => null);

  if (!client) {
    return res.status(503).json({
      message: "Database unavailable",
    });
  }

  try {
    await client.query("BEGIN");

    // Prevent processing the same event twice
    const eventResult = await client.query(
      `INSERT INTO stripe_webhook_events (
        event_id,
        event_type
      )
      VALUES ($1, $2)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id`,
      [event.id, event.type]
    );

    if (eventResult.rowCount === 0) {
      await client.query("COMMIT");

      return res.status(200).json({
        received: true,
      });
    }

    const eventSubscription =
      event.data.object as Stripe.Subscription;

    const customerId =
      typeof eventSubscription.customer === "string"
        ? eventSubscription.customer
        : eventSubscription.customer.id;

    // Find the user associated with the Stripe customer
    const customerResult = await client.query(
      `SELECT user_id, stripe_subscription_id
       FROM subscriptions
       WHERE stripe_customer_id = $1
       FOR UPDATE`,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      console.error("Stripe customer mapping not found:", customerId);

      return res.status(409).json({
        message: "Customer mapping not found",
      });
    }

    const user = customerResult.rows[0];

    // Retrieve the latest subscription state from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      eventSubscription.id
    );

    const item = subscription.items.data[0];
    const priceId = item?.price.id ?? null;

    const hasPaidAccess =
      subscription.status === "active" ||
      subscription.status === "trialing";

    // Ignore inactive events for an older subscription
    if (
      user.stripe_subscription_id &&
      user.stripe_subscription_id !== subscription.id &&
      !hasPaidAccess
    ) {
      await client.query("COMMIT");

      return res.status(200).json({
        received: true,
      });
    }

    let plan: "free" | "pro" | "premium" = "free";

    if (hasPaidAccess) {
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        plan = "pro";
      } else if (
        priceId === process.env.STRIPE_PREMIUM_PRICE_ID
      ) {
        plan = "premium";
      }
    }

    const periodEnd = item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null;

    // Handle both Stripe cancellation scheduling methods
    const isCancellationScheduled =
      subscription.cancel_at_period_end ||
      (
        hasPaidAccess &&
        subscription.cancel_at !== null &&
        subscription.cancel_at > Math.floor(Date.now() / 1000)
      );

    // Synchronise the subscription with PostgreSQL
    await client.query(
      `UPDATE subscriptions
       SET
         stripe_subscription_id = $1,
         stripe_price_id = $2,
         plan = $3,
         status = $4,
         current_period_end = $5,
         cancel_at_period_end = $6,
         updated_at = NOW()
       WHERE user_id = $7`,
      [
        subscription.id,
        priceId,
        plan,
        subscription.status,
        periodEnd,
        isCancellationScheduled,
        user.user_id,
      ]
    );

    await client.query("COMMIT");

    console.log(
      `Subscription synchronized: user=${user.user_id}, plan=${plan}, status=${subscription.status}, cancellationScheduled=${isCancellationScheduled}`
    );

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Stripe webhook error:", error);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  } finally {
    client.release();
  }
}