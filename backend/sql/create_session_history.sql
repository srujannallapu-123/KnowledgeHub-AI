CREATE TABLE IF NOT EXISTS session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    companion_id UUID NOT NULL
        REFERENCES companions(id) ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_history_user
ON session_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_history_recent
ON session_history(created_at DESC);