import { ReplyButton } from "../whatsapp/whatsappClient.js";

export const CONFIRM_ABANDON_MENU_BUTTON_ID = "CONFIRM_ABANDON_MENU";
export const CONFIRM_ABANDON_LANGUAGE_BUTTON_ID = "CONFIRM_ABANDON_LANGUAGE";
export const ABANDON_KEEP_GOING_BUTTON_ID = "ABANDON_KEEP_GOING";

export type AbandonTarget = "MENU" | "LANGUAGE";

export function getAbandonConfirmationMessage(): string {
    return "⚠️ You're in the middle of filing a complaint. Going ahead will "
        + "cancel it and you'll lose your progress.\n\n"
        + "Are you sure you want to continue?";
}

// Encodes the intended destination (main menu vs. language selection) into
// the confirm button's own ID -- avoids persisting a separate "pending
// abandon target" field in the session, since the button ID itself carries
// it through to handleAbandonConfirmationStep.
export function getAbandonConfirmationButtons(target: AbandonTarget): ReplyButton[] {
    return [
        {
            id: target === "MENU" ? CONFIRM_ABANDON_MENU_BUTTON_ID : CONFIRM_ABANDON_LANGUAGE_BUTTON_ID,
            title: "Yes, cancel it",
        },
        {
            id: ABANDON_KEEP_GOING_BUTTON_ID,
            title: "Keep going",
        },
    ];
}