export const COMPLAINT_STATUSES = {
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    IN_REVIEW: "IN_REVIEW",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
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

export const MEDIA_UPLOAD_LIMIT = 5;

export const COMPLAINT_STATUS_UPDATED_BY_TYPES = {
    SYSTEM: "SYSTEM",
    OFFICER: "OFFICER",
} as const;

export type ComplaintStatusUpdatedByType =
    (typeof COMPLAINT_STATUS_UPDATED_BY_TYPES)[keyof typeof COMPLAINT_STATUS_UPDATED_BY_TYPES];

// AWAITING_ABANDON_CONFIRMATION: citizen tried to abandon the complaint
// (via Main Menu, Cancel, or Language change) mid-flow. Sits between the
// abandon attempt and the actual cancellation, waiting for an explicit
// confirm/decline. Not entered via Back -- Back is real step-navigation,
// not an abandon attempt (see complaintStepHandlers.ts).
export const COMPLAINT_FLOW_STEPS = {
    AWAITING_FLOW_SUBMISSION: "AWAITING_FLOW_SUBMISSION",
    AWAITING_LOCATION_SUBMISSION: "AWAITING_LOCATION_SUBMISSION",
    AWAITING_MEDIA_SUBMISSION: "AWAITING_MEDIA_SUBMISSION",
    AWAITING_ABANDON_CONFIRMATION: "AWAITING_ABANDON_CONFIRMATION",
} as const;

export type ComplaintFlowStep =
    (typeof COMPLAINT_FLOW_STEPS)[keyof typeof COMPLAINT_FLOW_STEPS];

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

export const ID_PROOF_TYPES = {
    AADHAAR: "AADHAAR",
    PAN: "PAN",
    VOTER_ID: "VOTER_ID",
    DRIVING_LICENSE: "DRIVING_LICENSE",
    OTHER: "OTHER",
} as const;

export type IdProofType =
    (typeof ID_PROOF_TYPES)[keyof typeof ID_PROOF_TYPES];