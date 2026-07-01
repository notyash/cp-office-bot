-- users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    -- Stable sender identifier used by your app.
    -- Usually WhatsApp wa_id, but can fallback to Meta user_id.
    sender_id TEXT UNIQUE NOT NULL,

    -- Actual WhatsApp wa_id/phone when available.
    wa_id TEXT UNIQUE,

    display_name VARCHAR(50),

    preferred_language TEXT CHECK (
        preferred_language IN ('EN', 'MR', 'HI')
    ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,

    user_id INT NOT NULL REFERENCES users(id),

    state TEXT NOT NULL CHECK (
        state IN (
            'WAITING_FOR_LANGUAGE',
            'READY',
            'IN_COMPLAINT_FLOW',
            'CHECKING_COMPLAINT_STATUS',
            'ENDED'
        )
    ),

    active_intent TEXT CHECK (
        active_intent IN (
            'FILE_COMPLAINT',
            'CHECK_COMPLAINT_STATUS',
            'FIND_POLICE_STATION',
            'FIND_PARKING',
            'GENERAL_QNA',
            'UNKNOWN'
        )
    ),

    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    ended_at TIMESTAMPTZ,
    end_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for active session of a user
CREATE INDEX idx_sessions_active_user
ON sessions(user_id)
WHERE ended_at IS NULL;

-- Useful for cleaning expired sessions later
CREATE INDEX idx_sessions_expires_at
ON sessions(expires_at);