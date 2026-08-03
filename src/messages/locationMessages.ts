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

export function getLocationRequestMessage(): string {
    return "✅ Your complaint details have been saved.\n\n"
        + "📍 Would you like to share the location of the incident? This "
        + "helps us process your complaint accurately.";
}

export function getLocationSkipFollowUpMessage(): string {
    return "Or tap *Skip* if you'd rather not share your location.";
}

export function getLocationReminderMessage(): string {
    return "📍 Please tap the *Send Location* button above to share the "
        + "incident location, or press *Skip* to continue without it.";
}

// Shared tail for both post-location-step outcomes -- keeps the file-type
// list in sync with mediaMessages.ts instead of two copies drifting apart.
function getMediaStepEntryMessage(prefix: string): string {
    return `${prefix}\nYou can now send *photos*, *videos*, *audio*, or *documents* `
        + `related to your complaint, or press *Done* if you have nothing to add.`;
}

export function getLocationSavedMessage(): string {
    return getMediaStepEntryMessage("📍 Got your location!");
}

export function getLocationSkippedMessage(): string {
    return getMediaStepEntryMessage("No problem.");
}