import { Pool } from "pg";
import { ComplaintMediaKind, COMPLAINT_MEDIA_KINDS } from "../../constants/complaints.js";

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
    // ID_PROOF is excluded deliberately -- the 5-file MEDIA_UPLOAD_LIMIT
    // applies only to post-submission attachments (photos/videos/audio/
    // documents sent during AWAITING_MEDIA_SUBMISSION). The ID proof
    // document is a separate concept attached earlier via the Flow itself
    // and shouldn't eat into that limit.
    const result = await pool.query<{ count: string }>(
        `
        SELECT COUNT(*)::text AS count
        FROM complaint_media
        WHERE complaint_id = $1
            AND media_kind != $2;
        `,
        [complaintId, COMPLAINT_MEDIA_KINDS.ID_PROOF]
    );

    return Number(assertRow(result.rows[0], "Failed to count complaint media").count);
}

export async function addComplaintMedia(
    pool: Pool,
    complaintId: number,
    mediaKind: ComplaintMediaKind,
    whatsappMediaId: string | null,
    mimeType: string | null,
    fileName: string | null = null,
    metadata: Record<string, unknown> = {}
): Promise<DbComplaintMedia> {
    const result = await pool.query<DbComplaintMedia>(
        `
        INSERT INTO complaint_media (
            complaint_id,
            media_kind,
            whatsapp_media_id,
            mime_type,
            file_name,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
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
        [complaintId, mediaKind, whatsappMediaId, mimeType, fileName, JSON.stringify(metadata)]
    );

    return assertRow(result.rows[0], "Failed to insert complaint media");
}