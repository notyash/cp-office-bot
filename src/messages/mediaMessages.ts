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
    return "📎 Would you like to attach any photos, videos, audio, or "
        + "documents related to the complaint? If not, press Done.";
}

export function getMediaUploadedMessage(remainingSlots: number): string {
    if (remainingSlots <= 0) {
        return "✅ Got it! You've reached the limit of 5 files — press Done to finish up.";
    }

    if (remainingSlots === 1) {
        return "✅ Got it! You can upload 1 more file, or press Done.";
    }

    return `✅ Got it! You can upload ${remainingSlots} more, or press Done.`;
}

export function getMediaLimitReachedMessage(): string {
    return "You've already uploaded the maximum of 5 files. Press Done to finish up.";
}

export function getMediaUnsupportedTypeMessage(): string {
    return "That file type isn't supported. Please send a photo, video, "
        + "audio, or document — or press Done.";
}

export function getComplaintFinalizedMessage(complaintNumber: string): string {
    return `✅ Your complaint has been submitted.\n\n`
        + `*Complaint number:* ${complaintNumber}\n\n`
        + `Thank you for reporting this to us.`;
}

export function getComplaintFinalizedAfterLimitMessage(complaintNumber: string): string {
    return `✅ Got it — that was your last upload (limit of 5 reached).\n\n`
        + `Your complaint has been submitted.\n\n`
        + `*Complaint number:* ${complaintNumber}\n\n`
        + `Thank you for reporting this to us.`;
}