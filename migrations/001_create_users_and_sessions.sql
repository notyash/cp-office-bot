CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wa_id TEXT UNIQUE NOT NULL,
    display_name VARCHAR(50),
    preferred_language VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ,
    state TEXT NOT NULL,
    active_task TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    end_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_active
ON sessions(user_id, ended_at, expires_at);