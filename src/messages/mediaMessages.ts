import { ReplyButton } from "../whatsapp/whatsappClient.js";

export const COMPLAINT_DONE_BUTTON_ID = "COMPLAINT_DONE";

export function getComplaintMediaButtons(): ReplyButton[] {
    return [
        {
            id: COMPLAINT_DONE_BUTTON_ID,
            title: "Done",
        },
    ];
}

export function getMediaReminderMessage(): string {
    return "Do you want to attach a photo/video regarding the complaint? "
        + "If not, press Done.";
}

export function getMediaUploadedMessage(remainingSlots: number): string {
    if (remainingSlots <= 0) {
        return "Got it! You've reached your limit of 5 files — press Done to finish up.";
    }

    if (remainingSlots === 1) {
        return "Got it! You have 1 more upload left — make it count, or press Done.";
    }

    return `Got it! You can upload ${remainingSlots} more, or press Done.`;
}

export function getMediaLimitReachedMessage(): string {
    return "You've already uploaded the maximum of 5 files. Press Done to finish up.";
}

export function getMediaUnsupportedTypeMessage(): string {
    return "That file type isn't supported. Please send a photo, video, audio, or document — or press Done.";
}

export function getComplaintFinalizedMessage(complaintNumber: string): string {
    return `Your complaint has been submitted. Complaint number: ${complaintNumber}.\n`
        + `Thank you for reporting this to us.`;
}

// Used when the 5-file limit itself is what triggers finalization (no Done
// tap needed) -- combines the upload acknowledgement and the finalization
// confirmation into one message rather than sending two in a row for
// something that's just plain text (unlike the location step's native
// button message, there's no platform reason to split this one).
export function getComplaintFinalizedAfterLimitMessage(complaintNumber: string): string {
    return `Got it! That was your last upload (limit of 5 reached).\n`
        + `Your complaint has been submitted. Complaint number: ${complaintNumber}.\n`
        + `Thank you for reporting this to us.`;
}