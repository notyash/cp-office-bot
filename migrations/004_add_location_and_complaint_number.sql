-- Add incident_location, collected as a free-text field from the Flow's
-- incident_location TextArea. Nullable for now since existing DRAFT rows
-- (if any) predate this column.
ALTER TABLE complaints
    ADD COLUMN incident_location TEXT;

-- Backing sequence for human-facing complaint numbers.
-- Using a real sequence (not COUNT(*) + 1) so concurrent submissions
-- can never collide on the same number.
CREATE SEQUENCE IF NOT EXISTS complaint_number_seq
    START WITH 1
    INCREMENT BY 1;