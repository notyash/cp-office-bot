export const MEDIA_UPLOAD_LIMIT = 5;

export const COMPLAINT_STATUSES = {
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    IN_REVIEW: "IN_REVIEW",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    REJECTED: "REJECTED",
} as const;

export type ComplaintStatus =
    (typeof COMPLAINT_STATUSES)[keyof typeof COMPLAINT_STATUSES];

export const COMPLAINT_LOCATION_SOURCES = {
    MANUAL_TEXT: "MANUAL_TEXT",
    WHATSAPP_LOCATION: "WHATSAPP_LOCATION",
    WHATSAPP_LIVE_LOCATION: "WHATSAPP_LIVE_LOCATION",
    UNKNOWN: "UNKNOWN",
} as const;

export type ComplaintLocationSource =
    (typeof COMPLAINT_LOCATION_SOURCES)[keyof typeof COMPLAINT_LOCATION_SOURCES];

export const COMPLAINT_MEDIA_KINDS = {
    IMAGE: "IMAGE",
    VIDEO: "VIDEO",
    AUDIO: "AUDIO",
    DOCUMENT: "DOCUMENT",
    ID_PROOF: "ID_PROOF",
    OTHER: "OTHER",
} as const;

export type ComplaintMediaKind =
    (typeof COMPLAINT_MEDIA_KINDS)[keyof typeof COMPLAINT_MEDIA_KINDS];

export const COMPLAINT_STATUS_UPDATED_BY_TYPES = {
    SYSTEM: "SYSTEM",
    OFFICER: "OFFICER",
} as const;

export type ComplaintStatusUpdatedByType =
    (typeof COMPLAINT_STATUS_UPDATED_BY_TYPES)[keyof typeof COMPLAINT_STATUS_UPDATED_BY_TYPES];

// Manual step-by-step chat collection steps removed — Flow is now the only
// input source for filing a complaint. Reintroduce a chat-based fallback
// path here later if needed (e.g. resilience against another Integrity block).
export const COMPLAINT_FLOW_STEPS = {
    AWAITING_FLOW_SUBMISSION: "AWAITING_FLOW_SUBMISSION",
    // Entered once the Flow submission succeeds (complaint is SUBMITTED).
    // Handler not built yet -- complaintFlowHandler's default case covers
    // it as a placeholder in the meantime.
    AWAITING_MEDIA_SUBMISSION: "AWAITING_MEDIA_SUBMISSION",
} as const;

export type ComplaintFlowStep =
    (typeof COMPLAINT_FLOW_STEPS)[keyof typeof COMPLAINT_FLOW_STEPS];

// Matches the Flow JSON's category dropdown data-source ids exactly.
export const COMPLAINT_CATEGORIES = {
    THEFT: "THEFT",
    HARASSMENT: "HARASSMENT",
    CYBER_CRIME: "CYBER_CRIME",
    TRAFFIC: "TRAFFIC",
    MISSING_PERSON: "MISSING_PERSON",
    OTHER: "OTHER",
} as const;

export type ComplaintCategory =
    (typeof COMPLAINT_CATEGORIES)[keyof typeof COMPLAINT_CATEGORIES];

// ID proof type values are still used — they match the Flow JSON's
// id_proof_type dropdown data-source ids exactly.
export const ID_PROOF_TYPES = {
    AADHAAR: "AADHAAR",
    PAN: "PAN",
    VOTER_ID: "VOTER_ID",
    DRIVING_LICENSE: "DRIVING_LICENSE",
    OTHER: "OTHER",
} as const;

export type IdProofType =
    (typeof ID_PROOF_TYPES)[keyof typeof ID_PROOF_TYPES];
