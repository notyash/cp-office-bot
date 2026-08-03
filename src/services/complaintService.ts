import { Pool } from "pg";

import {
    COMPLAINT_CATEGORIES,
    COMPLAINT_MEDIA_KINDS,
} from "../constants/complaints.js";

import {
    DbComplaint,
    finalizeComplaintSubmission,
    FlowComplaintSubmission,
    saveComplaintDetailsFromFlow,
} from "../db/repositories/complaintRepository.js";

import { getPoliceStationByCode } from "../db/repositories/policeStationRepository.js";
import { addComplaintMedia } from "../db/repositories/complaintMediaRepository.js";

import {
    normalizePhoneNumber,
    normalizeRequiredText,
} from "./complaintInputService.js";

export type SubmitComplaintResult =
    | { success: true; complaint: DbComplaint }
    | { success: false; reason: "VALIDATION_FAILED"; errors: string[] }
    | { success: false; reason: "ALREADY_FINALIZED" };

export type FinalizeComplaintResult =
    | { success: true; complaint: DbComplaint }
    | { success: false; reason: "ALREADY_FINALIZED" };

// The raw, unvalidated object parsed from the Flow's nfm_reply.response_json.
// Meta also includes a flow_token key here (unused right now, ignored below).
// Widened from Record<string, string | undefined> -- id_proof_document
// (a DocumentPicker field) comes back as an array of media objects, not a
// string, unlike every other field on this Flow.
type RawFlowResponse = Record<string, unknown>;

// Shape confirmed by testing a live submission with a document attached:
// [{ id, mime_type, sha256, file_name }]. "id" arrives as an unquoted JSON
// number from Meta -- whatsappParser.ts quotes it into a string before
// JSON.parse to avoid silent precision loss on large media IDs, so by the
// time it reaches here it should already be a string.
function extractIdProofDocument(
    value: unknown
): { mediaId: string; mimeType: string; fileName: string | null; sha256: string | null } | null {
    if (!Array.isArray(value) || value.length === 0) {
        return null;
    }

    const first = value[0] as Record<string, unknown> | undefined;

    if (
        !first
        || typeof first.id !== "string"
        || typeof first.mime_type !== "string"
    ) {
        // Malformed/unexpected shape -- best-effort field, so this is
        // logged and skipped rather than failing the whole submission.
        console.log("id_proof_document present but did not match expected shape:", value);
        return null;
    }

    return {
        mediaId: first.id,
        mimeType: first.mime_type,
        fileName: typeof first.file_name === "string" ? first.file_name : null,
        sha256: typeof first.sha256 === "string" ? first.sha256 : null,
    };
}

export async function submitComplaint(
    pool: Pool,
    complaintId: number,
    rawResponse: RawFlowResponse
): Promise<SubmitComplaintResult> {
    const errors: string[] = [];

    const fullName = normalizeRequiredText(rawResponse.full_name as string | undefined, 3);
    if (!fullName) {
        errors.push("full_name is missing or too short");
    }

    const phone = normalizePhoneNumber(rawResponse.phone_number as string | undefined);
    if (!phone) {
        errors.push("phone_number is missing or invalid");
    }

    const category = normalizeRequiredText(rawResponse.category as string | undefined);
    if (!category || !isValidCategory(category)) {
        errors.push("category is missing or not a recognized value");
    }

    const description = normalizeRequiredText(rawResponse.description as string | undefined);
    if (!description) {
        errors.push("description is missing");
    }

    // ID proof document is optional end-to-end -- the Flow doesn't require
    // it, and a malformed/missing value is never a validation failure.
    const idProofDocument = extractIdProofDocument(rawResponse.id_proof_document);

    // police_station is resolved separately below since a missing/unmatched
    // code is not a validation failure -- it's meant to store NULL
    // (NOT_SURE, or a station added to the Flow but not yet in the DB).
    const policeStationCode = normalizeRequiredText(rawResponse.police_station as string | undefined);
    if (!policeStationCode) {
        errors.push("police_station is missing");
    }

    if (
        errors.length > 0 ||
        !fullName ||
        !phone ||
        !category ||
        !description ||
        !policeStationCode
    ) {
        return { success: false, reason: "VALIDATION_FAILED", errors };
    }

    const policeStation = await getPoliceStationByCode(pool, policeStationCode);

    const submission: FlowComplaintSubmission = {
        policeStationId: policeStation?.id ?? null,
        fullName,
        phone,
        category,
        description,
    };

    const complaint = await saveComplaintDetailsFromFlow(pool, complaintId, submission);

    if (!complaint) {
        return { success: false, reason: "ALREADY_FINALIZED" };
    }

    // Best-effort: storing the ID proof document is not allowed to fail an
    // otherwise-successful submission. The complaint itself is already
    // saved by this point.
    if (idProofDocument) {
        try {
            await addComplaintMedia(
                pool,
                complaint.id,
                COMPLAINT_MEDIA_KINDS.ID_PROOF,
                idProofDocument.mediaId,
                idProofDocument.mimeType,
                idProofDocument.fileName,
                idProofDocument.sha256 ? { sha256: idProofDocument.sha256 } : {}
            );
        } catch (error) {
            console.log("Failed to store id_proof_document for complaint:", complaint.id, error);
        }
    }

    return { success: true, complaint };
}

function isValidCategory(value: string): boolean {
    return (Object.values(COMPLAINT_CATEGORIES) as string[]).includes(value);
}

// The actual "official submission" step. Called from two places -- the
// Done button, and auto-finalize when the 5-file media limit is reached --
// hence a small service wrapper here rather than each call site handling
// the repository's null-on-already-finalized case separately.
export async function finalizeComplaint(
    pool: Pool,
    complaintId: number
): Promise<FinalizeComplaintResult> {
    const complaint = await finalizeComplaintSubmission(pool, complaintId);

    if (!complaint) {
        return { success: false, reason: "ALREADY_FINALIZED" };
    }

    return { success: true, complaint };
}