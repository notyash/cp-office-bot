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

export function getComplaintSubmittedMessage(complaintNumber: string): string {
    return `Your complaint has been submitted. Complaint number: ${complaintNumber}.\n`
        + `You can now send photos, videos, audio, or documents related to your complaint, or press Done if you have nothing to add.`;
}