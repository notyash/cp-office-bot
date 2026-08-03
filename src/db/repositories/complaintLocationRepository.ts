import { Pool } from "pg";
import { ComplaintLocationSource } from "../../constants/complaints.js";

export type DbComplaintLocation = {
    id: number;
    complaint_id: number;
    source: ComplaintLocationSource;
    latitude: number | null;
    longitude: number | null;
    created_at: Date;
    updated_at: Date;
};

function assertRow<T>(row: T | undefined, errorMessage: string): T {
    if (!row) {
        throw new Error(errorMessage);
    }

    return row;
}

// complaint_id is UNIQUE on this table (one location per complaint), so this
// upserts rather than plain-inserting -- safe to call more than once for the
// same complaint (e.g. a retried webhook) without a constraint violation.
export async function upsertComplaintLocation(
    pool: Pool,
    complaintId: number,
    source: ComplaintLocationSource,
    latitude: number,
    longitude: number
): Promise<DbComplaintLocation> {
    const result = await pool.query<DbComplaintLocation>(
        `
        INSERT INTO complaint_locations (
            complaint_id,
            source,
            latitude,
            longitude
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (complaint_id)
        DO UPDATE SET
            source = EXCLUDED.source,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            updated_at = NOW()
        RETURNING
            id,
            complaint_id,
            source,
            latitude,
            longitude,
            created_at,
            updated_at;
        `,
        [complaintId, source, latitude, longitude]
    );

    return assertRow(result.rows[0], "Failed to upsert complaint location");
}