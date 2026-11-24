"use server";

import { apiFetch } from "@/lib/api";
import { redirect } from "next/navigation";

export type Subscription = {
  plan: "free" | "pro" | "premium";
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getSubscription() {
  return apiFetch<Subscription>(
    "/stripe/subscription"
  );
}

export async function createCheckoutSession(
  formData: FormData
) {
  const plan = formData.get("plan");

  if (plan !== "pro" && plan !== "premium") {
    throw new Error("Invalid subscription plan");
  }

  const result = await apiFetch<{ url: string }>(
    "/stripe/checkout",
    {
      method: "POST",
      body: JSON.stringify({ plan }),
    }
  );

  if (!result.url) {
    throw new Error("Checkout URL not received");
  }

  redirect(result.url);
}

export async function openBillingPortal() {
  const result = await apiFetch<{ url: string }>(
    "/stripe/portal",
    {
      method: "POST",
    }
  );

  if (!result.url) {
    throw new Error("Billing portal URL not received");
  }

  redirect(result.url);
}