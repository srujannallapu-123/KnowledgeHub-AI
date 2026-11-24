import "dotenv/config";
import Stripe from "stripe";


const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

if (!stripeSecretKey.startsWith("sk_test_")) {
  throw new Error("Only Stripe sandbox keys are allowed");
}

export const stripe = new Stripe(stripeSecretKey);