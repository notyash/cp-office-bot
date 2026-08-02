import { Pool } from "pg";

import {
    ComplaintMediaKind,
    COMPLAINT_MEDIA_KINDS,
    MEDIA_UPLOAD_LIMIT,
} from "../constants/complaints.js";

import { IncomingMessageType } from "../types/incomingMessageDto.js";

import {
    addComplaintMedia,
    countComplaintMedia,
    DbComplaintMedia,
} from "../db/repositories/complaintMediaRepository.js";

export type SubmitComplaintMediaResult =
    | { success: true; media: DbComplaintMedia; remainingSlots: number }
    | { success: false; reason: "LIMIT_REACHED" }
    | { success: false; reason: "UNSUPPORTED_TYPE" };

const MESSAGE_TYPE_TO_MEDIA_KIND: Partial<
    Record<IncomingMessageType, ComplaintMediaKind>
> = {
    image: COMPLAINT_MEDIA_KINDS.IMAGE,
    video: COMPLAINT_MEDIA_KINDS.VIDEO,
    audio: COMPLAINT_MEDIA_KINDS.AUDIO,
    document: COMPLAINT_MEDIA_KINDS.DOCUMENT,
};

export function isSupportedMediaMessageType(
    type: IncomingMessageType
): boolean {
    return type in MESSAGE_TYPE_TO_MEDIA_KIND;
}

export async function submitComplaintMedia(
    pool: Pool,
    complaintId: number,
    messageType: IncomingMessageType,
    whatsappMediaId: string | undefined,
    mimeType: string | undefined,
    sha256: string | undefined
): Promise<SubmitComplaintMediaResult> {
    const mediaKind = MESSAGE_TYPE_TO_MEDIA_KIND[messageType];

    if (!mediaKind) {
        return { success: false, reason: "UNSUPPORTED_TYPE" };
    }

    const existingCount = await countComplaintMedia(pool, complaintId);

    if (existingCount >= MEDIA_UPLOAD_LIMIT) {
        return { success: false, reason: "LIMIT_REACHED" };
    }

    const media = await addComplaintMedia(
        pool,
        complaintId,
        mediaKind,
        whatsappMediaId ?? null,
        mimeType ?? null,
        null,
        sha256 ? { sha256 } : {}
    );

    // existingCount was the count *before* this insert, so the newly
    // inserted file is number (existingCount + 1) out of MEDIA_UPLOAD_LIMIT.
    const remainingSlots = MEDIA_UPLOAD_LIMIT - (existingCount + 1);

    return { success: true, media, remainingSlots };
}