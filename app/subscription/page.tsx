import {
  Check,
  Sparkles,
  Zap,
  Crown,
  CreditCard,
  ShieldCheck,
  CircleCheck,
  Info,
} from "lucide-react";

import {
  getSubscription,
  createCheckoutSession,
  openBillingPortal,
} from "@/lib/actions/subscription.actions";

import SubscriptionButton from "@/components/SubscriptionButton";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0",
    description: "Start your personalised learning journey.",
    icon: Zap,
    popular: false,
    features: [
      "Create up to 3 AI companions",
      "Interactive AI voice tutoring",
      "Real-time conversation transcripts",
      "Personal learning history",
      "Access to companion library",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "9.99",
    description: "More flexibility for dedicated learners.",
    icon: Sparkles,
    popular: true,
    features: [
      "Create up to 10 AI companions",
      "Interactive AI voice tutoring",
      "Real-time conversation transcripts",
      "Personal learning history",
      "Access to companion library",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "19.99",
    description: "Create companions without a count limit.",
    icon: Crown,
    popular: false,
    features: [
      "Unlimited AI companion creation",
      "Interactive AI voice tutoring",
      "Real-time conversation transcripts",
      "Personal learning history",
      "Access to companion library",
    ],
  },
] as const;

type Props = {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
  }>;
};

export default async function SubscriptionPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const subscription = await getSubscription();

  const hasPaidAccess =
    subscription.status === "active" ||
    subscription.status === "trialing";

  const currentPlan = hasPaidAccess
    ? subscription.plan
    : "free";

  const hasBillingSubscription =
    !["inactive", "canceled", "incomplete_expired"].includes(
      subscription.status
    );

  return (
    <main className="mx-auto w-full max-w-7xl">

      {/* Page heading */}

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[#d94320]">
          <CreditCard className="h-5 w-5" />
          <span className="text-sm font-semibold">
            Subscription & Billing
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Invest in your learning
        </h1>

        <p className="text-gray-500">
          Choose the plan that fits your learning goals.
        </p>
      </section>

      {/* Payment notifications */}

      {params.success === "true" && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Checkout completed
            </p>

            <p className="text-sm">
              Your subscription will update once Stripe
              confirms your payment. Refresh this page
              if your new plan is not displayed yet.
            </p>
          </div>
        </div>
      )}

      {params.canceled === "true" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Info className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Checkout canceled. Your existing plan
            remains unchanged.
          </p>
        </div>
      )}

      {/* Current subscription */}

      <section className="relative overflow-hidden rounded-2xl bg-[#19192e] p-6 text-white md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>
            <p className="text-sm text-gray-300">
              Your current subscription
            </p>

            <h2 className="mt-2 text-3xl font-bold capitalize">
              {currentPlan} Plan
            </h2>

            <p className="mt-2 text-sm text-gray-300">
              Billing status:{" "}
              {subscription.status === "inactive"
                ? "Free membership"
                : subscription.status.replaceAll("_", " ")}
            </p>

            {subscription.current_period_end &&
              hasPaidAccess && (
                <p className="mt-2 text-sm text-gray-300">
                  {subscription.cancel_at_period_end
                    ? "Access ends on "
                    : "Current billing period ends on "}

                  {new Date(
                    subscription.current_period_end
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
          </div>

          {hasBillingSubscription && (
            <form action={openBillingPortal}>
              <SubscriptionButton label="Manage subscription" />
            </form>
          )}
        </div>
      </section>

      {/* Pricing cards */}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;

          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl
                border bg-white p-6
                ${
                  plan.popular
                    ? "border-[#d94320] shadow-sm"
                    : "border-gray-200"
                }`}
            >
              {plan.popular && (
                <span className="absolute right-5 top-5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#d94320]">
                  Most popular
                </span>
              )}

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#d94320]">
                <Icon className="h-6 w-6" />
              </div>

              <h2 className="text-xl font-bold">
                {plan.name}
              </h2>

              <p className="mt-2 min-h-12 text-sm text-gray-500">
                {plan.description}
              </p>

              <div className="my-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  £{plan.price}
                </span>

                <span className="text-sm text-gray-500">
                  /month
                </span>
              </div>

              <div className="mb-6 border-t border-gray-100" />

              <ul className="mb-8 flex flex-1 flex-col gap-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <Check className="h-5 w-5 shrink-0 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <SubscriptionButton
                  label="Current plan"
                  disabled
                />
              ) : hasBillingSubscription ? (
                <form action={openBillingPortal}>
                  <SubscriptionButton
                    label={
                      plan.id === "free"
                        ? "Manage cancellation"
                        : `Switch to ${plan.name}`
                    }
                    primary={plan.popular}
                  />
                </form>
              ) : plan.id === "free" ? (
                <SubscriptionButton
                  label="Free plan"
                  disabled
                />
              ) : (
                <form action={createCheckoutSession}>
                  <input
                    type="hidden"
                    name="plan"
                    value={plan.id}
                  />

                  <SubscriptionButton
                    label={`Upgrade to ${plan.name}`}
                    primary={plan.popular}
                  />
                </form>
              )}
            </article>
          );
        })}
      </section>

      {/* Secure payment information */}

      <section className="flex flex-col items-center gap-2 py-5 text-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          Secure payments powered by Stripe
        </div>

        <p className="text-sm text-gray-500">
          Manage or cancel your subscription through
          the billing portal.
        </p>

        <p className="text-xs text-gray-400">
          Development sandbox — no real payments
          are processed.
        </p>
      </section>
    </main>
  );
}