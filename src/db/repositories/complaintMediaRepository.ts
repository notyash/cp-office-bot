import { Pool } from "pg";
import { ComplaintMediaKind } from "../../constants/complaints.js";

export type DbComplaintMedia = {
    id: number;
    complaint_id: number;
    media_kind: ComplaintMediaKind;
    whatsapp_media_id: string | null;
    mime_type: string | null;
    file_name: string | null;
    file_size_bytes: number | null;
    storage_provider: string;
    storage_key: string | null;
    storage_url: string | null;
    metadata: Record<string, unknown>;
    created_at: Date;
};

function assertRow<T>(row: T | undefined, errorMessage: string): T {
    if (!row) {
        throw new Error(errorMessage);
    }

    return row;
}

export async function countComplaintMedia(
    pool: Pool,
    complaintId: number
): Promise<number> {
    const result = await pool.query<{ count: string }>(
        `
        SELECT COUNT(*)::text AS count
        FROM complaint_media
        WHERE complaint_id = $1;
        `,
        [complaintId]
    );

    return Number(assertRow(result.rows[0], "Failed to count complaint media").count);
}

export async function addComplaintMedia(
    pool: Pool,
    complaintId: number,
    mediaKind: ComplaintMediaKind,
    whatsappMediaId: string | null,
    mimeType: string | null
): Promise<DbComplaintMedia> {
    const result = await pool.query<DbComplaintMedia>(
        `
        INSERT INTO complaint_media (
            complaint_id,
            media_kind,
            whatsapp_media_id,
            mime_type
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            complaint_id,
            media_kind,
            whatsapp_media_id,
            mime_type,
            file_name,
            file_size_bytes,
            storage_provider,
            storage_key,
            storage_url,
            metadata,
            created_at;
        `,
        [complaintId, mediaKind, whatsappMediaId, mimeType]
    );

    return assertRow(result.rows[0], "Failed to insert complaint media");
}