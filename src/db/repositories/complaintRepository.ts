import { Pool } from "pg";
import {
    COMPLAINT_STATUSES,
    ComplaintStatus,
} from "../../constants/complaints.js";

export type DbComplaint = {
    id: number;
    complaint_number: string | null;

    user_id: number;
    police_station_id: number | null;

    status: ComplaintStatus;

    category: string | null;

    complainant_full_name: string | null;
    complainant_phone: string | null;

    description: string | null;

    submitted_at: Date | null;

    created_at: Date;
    updated_at: Date;
};

// Fields collected from the WhatsApp Flow's nfm_reply, already validated
// and resolved (police_station_id looked up from the Flow's station code).
// incident_location removed -- location is now collected separately via
// AWAITING_LOCATION_SUBMISSION (WhatsApp native location share) and stored
// in complaint_locations, not as free text on the Flow itself.
// id_proof_type removed -- officer dashboard won't need to filter by ID
// type. id_proof_number removed -- the Flow no longer has a text field for
// it; it was replaced by id_proof_document (a DocumentPicker upload), which
// isn't wired up here yet since its nfm_reply payload shape is still
// unconfirmed -- see complaintService.ts for the pending TODO.
export type FlowComplaintSubmission = {
    policeStationId: number | null;
    fullName: string;
    phone: string;
    category: string;
    description: string;
};

function assertComplaint(row: DbComplaint | undefined): DbComplaint {
    if (!row) {
        throw new Error("Expected complaint row but got none");
    }

    return row;
}

export async function createDraftComplaint(
    pool: Pool,
    userId: number
): Promise<DbComplaint> {
    const result = await pool.query<DbComplaint>(
        `
        INSERT INTO complaints (
            user_id,
            status
        )
        VALUES ($1, $2)
        RETURNING
            id,
            complaint_number,
            user_id,
            police_station_id,
            status,
            category,
            complainant_full_name,
            complainant_phone,
            description,
            submitted_at,
            created_at,
            updated_at
        `,
        [userId, COMPLAINT_STATUSES.DRAFT]
    );

    return assertComplaint(result.rows[0]);
}

export async function getComplaintByIdForUser(
    pool: Pool,
    complaintId: number,
    userId: number
): Promise<DbComplaint | null> {
    const result = await pool.query<DbComplaint>(
        `
        SELECT
            id,
            complaint_number,
            user_id,
            police_station_id,
            status,
            category,
            complainant_full_name,
            complainant_phone,
            description,
            submitted_at,
            created_at,
            updated_at
        FROM complaints
        WHERE id = $1
            AND user_id = $2
        LIMIT 1
        `,
        [complaintId, userId]
    );

    return result.rows[0] ?? null;
}

export async function getSubmittedComplaintsForUser(
    pool: Pool,
    userId: number
): Promise<DbComplaint[]> {
    const result = await pool.query<DbComplaint>(
        `
        SELECT
            id,
            complaint_number,
            user_id,
            police_station_id,
            status,
            category,
            complainant_full_name,
            complainant_phone,
            description,
            submitted_at,
            created_at,
            updated_at
        FROM complaints
        WHERE user_id = $1
            AND status != $2
        ORDER BY created_at DESC
        `,
        [userId, COMPLAINT_STATUSES.DRAFT]
    );

    return result.rows;
}

// Writes every field collected from the Flow in one UPDATE. Deliberately
// does NOT flip status or generate a complaint_number -- the complaint is
// only "officially" submitted once the citizen finishes the whole flow
// (location + media steps), via finalizeComplaintSubmission below. This
// keeps the data safe (written as soon as the Flow is submitted, in case
// the citizen drops off mid-conversation) without prematurely showing them
// a complaint number for something not actually complete yet.
// The "AND status = DRAFT" guard means a duplicate/retried webhook for the
// same Flow submission simply returns no row instead of silently
// overwriting an already-finalized complaint's data.
export async function saveComplaintDetailsFromFlow(
    pool: Pool,
    complaintId: number,
    submission: FlowComplaintSubmission
): Promise<DbComplaint | null> {
    const result = await pool.query<DbComplaint>(
        `
        UPDATE complaints
        SET
            police_station_id = $1,
            category = $2,
            complainant_full_name = $3,
            complainant_phone = $4,
            description = $5,
            updated_at = NOW()
        WHERE id = $6
            AND status = $7
        RETURNING
            id,
            complaint_number,
            user_id,
            police_station_id,
            status,
            category,
            complainant_full_name,
            complainant_phone,
            description,
            submitted_at,
            created_at,
            updated_at
        `,
        [
            submission.policeStationId,
            submission.category,
            submission.fullName,
            submission.phone,
            submission.description,
            complaintId,
            COMPLAINT_STATUSES.DRAFT,
        ]
    );

    return result.rows[0] ?? null;
}

// The actual "official submission" step -- generates the complaint number
// and flips DRAFT -> SUBMITTED. Called only once the citizen finishes the
// whole flow: either they tap Done, or the 5-file media limit is reached
// (auto-finalized, no Done tap required in that case). The "AND status =
// DRAFT" guard protects against double-finalization (e.g. a race between
// a duplicate webhook and the auto-finalize path) -- calling this twice
// simply returns no row the second time, never a second complaint number.
export async function finalizeComplaintSubmission(
    pool: Pool,
    complaintId: number
): Promise<DbComplaint | null> {
    const result = await pool.query<DbComplaint>(
        `
        UPDATE complaints
        SET
            status = $1,
            complaint_number = 'CMP-' || EXTRACT(YEAR FROM NOW())::text
                || '-' || LPAD(nextval('complaint_number_seq')::text, 6, '0'),
            submitted_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
            AND status = $3
        RETURNING
            id,
            complaint_number,
            user_id,
            police_station_id,
            status,
            category,
            complainant_full_name,
            complainant_phone,
            description,
            submitted_at,
            created_at,
            updated_at
        `,
        [COMPLAINT_STATUSES.SUBMITTED, complaintId, COMPLAINT_STATUSES.DRAFT]
    );

    return result.rows[0] ?? null;
}