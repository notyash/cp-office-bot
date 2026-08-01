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

    id_proof_type: string | null;
    id_proof_number: string | null;

    incident_location: string | null;
    description: string | null;

    submitted_at: Date | null;

    created_at: Date;
    updated_at: Date;
};

// Fields collected from the WhatsApp Flow's nfm_reply, already validated
// and resolved (police_station_id looked up from the Flow's station code).
export type FlowComplaintSubmission = {
    policeStationId: number | null;
    fullName: string;
    phone: string;
    category: string;
    incidentLocation: string;
    description: string;
    idProofType: string | null;
    idProofNumber: string | null;
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
            id_proof_type,
            id_proof_number,
            incident_location,
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
            id_proof_type,
            id_proof_number,
            incident_location,
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
            id_proof_type,
            id_proof_number,
            incident_location,
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

// Writes every field collected from the Flow in one UPDATE and transitions
// DRAFT -> SUBMITTED, generating the complaint number in the same query via
// complaint_number_seq. The "AND status = DRAFT" guard means calling this
// twice on an already-submitted complaint (e.g. a duplicate/retried webhook)
// simply returns no row instead of silently re-submitting or double-counting
// the sequence's visible numbering gap risk is fine -- Postgres sequences are
// allowed to have gaps, that's expected and safe, not a correctness issue.
export async function submitComplaintFromFlow(
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
            id_proof_type = $5,
            id_proof_number = $6,
            incident_location = $7,
            description = $8,
            status = $9,
            complaint_number = 'CMP-' || EXTRACT(YEAR FROM NOW())::text
                || '-' || LPAD(nextval('complaint_number_seq')::text, 6, '0'),
            submitted_at = NOW(),
            updated_at = NOW()
        WHERE id = $10
            AND status = $11
        RETURNING
            id,
            complaint_number,
            user_id,
            police_station_id,
            status,
            category,
            complainant_full_name,
            complainant_phone,
            id_proof_type,
            id_proof_number,
            incident_location,
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
            submission.idProofType,
            submission.idProofNumber,
            submission.incidentLocation,
            submission.description,
            COMPLAINT_STATUSES.SUBMITTED,
            complaintId,
            COMPLAINT_STATUSES.DRAFT,
        ]
    );

    return result.rows[0] ?? null;
}