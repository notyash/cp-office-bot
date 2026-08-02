import { ReplyButton } from "../whatsapp/whatsappClient.js";

export const COMPLAINT_LOCATION_SKIP_BUTTON_ID = "COMPLAINT_LOCATION_SKIP";

export function getLocationSkipButtons(): ReplyButton[] {
    return [
        {
            id: COMPLAINT_LOCATION_SKIP_BUTTON_ID,
            title: "Skip",
        },
    ];
}

export function getLocationRequestMessage(complaintNumber: string): string {
    return `Your complaint has been submitted. Complaint number: ${complaintNumber}.\n`
        + `Would you like to share the location of the incident? Tap the `
        + `+ icon and choose Location, or press Skip to continue.`;
}

export function getLocationReminderMessage(): string {
    return "To share the incident location, tap the + icon and choose "
        + "Location. Or press Skip to continue without it.";
}

export function getLocationSavedMessage(): string {
    return "Got your location! You can now send photos, videos, audio, or "
        + "documents related to your complaint, or press Done if you have "
        + "nothing to add.";
}

export function getLocationSkippedMessage(): string {
    return "No problem. You can now send photos, videos, audio, or "
        + "documents related to your complaint, or press Done if you have "
        + "nothing to add.";
}