CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,

    stripe_customer_id TEXT UNIQUE,

    stripe_subscription_id TEXT UNIQUE,

    stripe_price_id TEXT,

    plan TEXT NOT NULL DEFAULT 'free'
        CHECK (plan IN ('free', 'pro', 'premium')),

    status TEXT NOT NULL DEFAULT 'inactive',

    current_period_end TIMESTAMPTZ,

    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);