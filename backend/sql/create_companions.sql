

CREATE TABLE IF NOT EXISTS companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic TEXT NOT NULL,
    voice VARCHAR(100) NOT NULL,
    style VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0),
    author TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
