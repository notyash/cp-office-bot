BEGIN;

-- 1. Fix active session index
-- Old index only made lookup faster, but allowed duplicate active sessions.
DROP INDEX IF EXISTS idx_sessions_active_user;

CREATE UNIQUE INDEX idx_sessions_one_active_user
ON sessions(user_id)
WHERE ended_at IS NULL;


-- 2. Police stations
CREATE TABLE police_stations (
    id SERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    code TEXT UNIQUE,

    jurisdiction_area TEXT,
    address TEXT,
    city TEXT,
    district TEXT,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    pincode TEXT,

    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),

    phone_number TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 3. Complaints
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,

    complaint_number TEXT UNIQUE,

    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    police_station_id INT REFERENCES police_stations(id) ON DELETE SET NULL,

    status TEXT NOT NULL CHECK (
        status IN (
            'DRAFT',
            'SUBMITTED',
            'IN_REVIEW',
            'IN_PROGRESS',
            'RESOLVED',
            'REJECTED'
        )
    ) DEFAULT 'DRAFT',

    category TEXT,

    complainant_full_name TEXT,
    complainant_phone TEXT,

    id_proof_type TEXT,
    id_proof_number TEXT,

    description TEXT,

    submitted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 4. Complaint incident location
CREATE TABLE complaint_locations (
    id SERIAL PRIMARY KEY,

    complaint_id INT NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,

    source TEXT NOT NULL CHECK (
        source IN (
            'MANUAL_TEXT',
            'WHATSAPP_LOCATION',
            'WHATSAPP_LIVE_LOCATION',
            'UNKNOWN'
        )
    ) DEFAULT 'UNKNOWN',

    address_text TEXT,
    landmark TEXT,

    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. Complaint media/evidence
CREATE TABLE complaint_media (
    id SERIAL PRIMARY KEY,

    complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,

    media_kind TEXT NOT NULL CHECK (
        media_kind IN (
            'IMAGE',
            'VIDEO',
            'AUDIO',
            'DOCUMENT',
            'ID_PROOF',
            'OTHER'
        )
    ),

    whatsapp_media_id TEXT,
    mime_type TEXT,
    file_name TEXT,
    file_size_bytes INT,

    storage_provider TEXT NOT NULL DEFAULT 'LOCAL',
    storage_key TEXT,
    storage_url TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 6. Complaint status history
CREATE TABLE complaint_status_updates (
    id SERIAL PRIMARY KEY,

    complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,

    old_status TEXT,
    new_status TEXT NOT NULL CHECK (
        new_status IN (
            'DRAFT',
            'SUBMITTED',
            'IN_REVIEW',
            'IN_PROGRESS',
            'RESOLVED',
            'REJECTED'
        )
    ),

    note TEXT,

    updated_by_type TEXT NOT NULL CHECK (
        updated_by_type IN ('SYSTEM', 'OFFICER')
    ) DEFAULT 'SYSTEM',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 7. Add flow tracking to sessions
-- active_step is intentionally flexible TEXT for now because steps may change during development.
ALTER TABLE sessions
ADD COLUMN active_step TEXT;

ALTER TABLE sessions
ADD COLUMN draft_complaint_id INT REFERENCES complaints(id) ON DELETE SET NULL;


-- 8. Indexes
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_police_station_id ON complaints(police_station_id);
CREATE INDEX idx_complaint_media_complaint_id ON complaint_media(complaint_id);
CREATE INDEX idx_complaint_status_updates_complaint_id ON complaint_status_updates(complaint_id);
CREATE INDEX idx_sessions_draft_complaint_id ON sessions(draft_complaint_id);

COMMIT;