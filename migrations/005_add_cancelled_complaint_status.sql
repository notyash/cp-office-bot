-- Adds CANCELLED as a valid complaint status -- used when a citizen
-- abandons a complaint mid-flow (Main Menu/Cancel/Language, after
-- confirming) or when a session expires mid-flow. Postgres CHECK
-- constraints can't be altered in place to add a value, so this drops and
-- recreates the constraint with the full allowed list.
ALTER TABLE complaints DROP CONSTRAINT complaints_status_check;

ALTER TABLE complaints ADD CONSTRAINT complaints_status_check CHECK (
    status IN (
        'DRAFT',
        'SUBMITTED',
        'IN_REVIEW',
        'IN_PROGRESS',
        'RESOLVED',
        'REJECTED',
        'CANCELLED'
    )
);