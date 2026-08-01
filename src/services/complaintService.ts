import { Pool } from "pg";

import {
    COMPLAINT_CATEGORIES,
    ID_PROOF_TYPES,
} from "../constants/complaints.js";

import {
    DbComplaint,
    FlowComplaintSubmission,
    submitComplaintFromFlow,
} from "../db/repositories/complaintRepository.js";

import { getPoliceStationByCode } from "../db/repositories/policeStationRepository.js";

import {
    normalizePhoneNumber,
    normalizeRequiredText,
} from "./complaintInputService.js";

export type SubmitComplaintResult =
    | { success: true; complaint: DbComplaint }
    | { success: false; reason: "VALIDATION_FAILED"; errors: string[] }
    | { success: false; reason: "ALREADY_SUBMITTED" };

// The raw, unvalidated object parsed from the Flow's nfm_reply.response_json.
// Meta also includes a flow_token key here (unused right now, ignored below).
type RawFlowResponse = Record<string, string | undefined>;

export async function submitComplaint(
    pool: Pool,
    complaintId: number,
    rawResponse: RawFlowResponse
): Promise<SubmitComplaintResult> {
    const errors: string[] = [];

    const fullName = normalizeRequiredText(rawResponse.full_name, 3);
    if (!fullName) {
        errors.push("full_name is missing or too short");
    }

    const phone = normalizePhoneNumber(rawResponse.phone_number);
    if (!phone) {
        errors.push("phone_number is missing or invalid");
    }

    const category = normalizeRequiredText(rawResponse.category);
    if (!category || !isValidCategory(category)) {
        errors.push("category is missing or not a recognized value");
    }

    const incidentLocation = normalizeRequiredText(rawResponse.incident_location);
    if (!incidentLocation) {
        errors.push("incident_location is missing");
    }

    const description = normalizeRequiredText(rawResponse.description);
    if (!description) {
        errors.push("description is missing");
    }

    // ID proof is optional end-to-end: the Flow doesn't require it, and an
    // empty string (field left blank) should collapse to null, not be
    // treated as a validation failure.
    const idProofType = normalizeRequiredText(rawResponse.id_proof_type);
    if (idProofType && !isValidIdProofType(idProofType)) {
        errors.push("id_proof_type is not a recognized value");
    }

    const idProofNumber = normalizeRequiredText(rawResponse.id_proof_number);

    // police_station is resolved separately below since a missing/unmatched
    // code is not a validation failure -- it's meant to store NULL
    // (NOT_SURE, or a station added to the Flow but not yet in the DB).
    const policeStationCode = normalizeRequiredText(rawResponse.police_station);
    if (!policeStationCode) {
        errors.push("police_station is missing");
    }

    if (
        errors.length > 0 ||
        !fullName ||
        !phone ||
        !category ||
        !incidentLocation ||
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
        incidentLocation,
        description,
        idProofType: idProofType ?? null,
        idProofNumber: idProofNumber ?? null,
    };

    const complaint = await submitComplaintFromFlow(pool, complaintId, submission);

    if (!complaint) {
        return { success: false, reason: "ALREADY_SUBMITTED" };
    }

    return { success: true, complaint };
}

function isValidCategory(value: string): boolean {
    return (Object.values(COMPLAINT_CATEGORIES) as string[]).includes(value);
}

function isValidIdProofType(value: string): boolean {
    return (Object.values(ID_PROOF_TYPES) as string[]).includes(value);
}