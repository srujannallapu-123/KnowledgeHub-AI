CREATE TABLE IF NOT EXISTS voice_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    companion_id UUID
        REFERENCES companions(id) ON DELETE SET NULL,

    vapi_call_id TEXT UNIQUE,

    reserved_seconds INTEGER NOT NULL
        CHECK (reserved_seconds > 0),

    used_seconds INTEGER NOT NULL DEFAULT 0
        CHECK (used_seconds >= 0),

    status TEXT NOT NULL DEFAULT 'reserved'
        CHECK (status IN (
            'reserved',
            'active',
            'completed',
            'failed'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voice_usage_user_created
ON voice_usage (user_id, created_at);