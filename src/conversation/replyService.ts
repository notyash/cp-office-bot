import {
  sendListMessage,
  sendLocationRequestMessage,
  sendReplyButtonsMessage,
  sendTextMessage,
} from "../whatsapp/whatsappClient.js";

import {
  getLanguageSavedMessage,
  getLanguageSelectionButtons,
  getLanguageSelectionMessage,
} from "../messages/languageMessages.js";

import {
  getInvalidMainMenuMessage,
  getMainMenuMessage,
  getMainMenuSections,
} from "../messages/menuMessages.js";

import {
  getNavigationButtons,
  getNavigationOptionsMessage,
} from "../messages/navigationMessages.js";

import {
  getComplaintFinalizedAfterLimitMessage,
  getComplaintFinalizedMessage,
  getComplaintMediaButtons,
  getMediaLimitReachedMessage,
  getMediaReminderMessage,
  getMediaUnsupportedTypeMessage,
  getMediaUploadedMessage,
} from "../messages/mediaMessages.js";

import {
  getLocationReminderMessage,
  getLocationRequestMessage,
  getLocationSavedMessage,
  getLocationSkippedMessage,
  getLocationSkipButtons,
  getLocationSkipFollowUpMessage,
} from "../messages/locationMessages.js";

import {
  AbandonTarget,
  getAbandonConfirmationButtons,
  getAbandonConfirmationMessage,
} from "../messages/abandonMessages.js";

import { sendFlowMessage } from "../whatsapp/whatsappClient.js";
import { env } from "../utils/env.js";

export async function sendLanguageSelectionReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getLanguageSelectionMessage(),
    getLanguageSelectionButtons(),
    "Select Language"
  );
}

export async function sendMainMenuReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendListMessage(
    phoneNumberId,
    to,
    getMainMenuMessage(),
    "View menu",
    getMainMenuSections(),
    "Main Menu"
  );
}

export async function sendLanguageSavedAndMainMenuReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendTextMessage(phoneNumberId, to, getLanguageSavedMessage());
  await sendMainMenuReply(phoneNumberId, to);
}

export async function sendInvalidMainMenuReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendTextMessage(phoneNumberId, to, getInvalidMainMenuMessage());
}

export async function sendPromptWithNavigation(
  phoneNumberId: string,
  to: string,
  body: string,
  header?: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    body,
    getNavigationButtons(),
    header
  );
}

// Standalone bubble carrying only Back/Main Menu -- sent as its own
// message after each complaint-flow step prompt, rather than merged into
// the same bubble as Skip/Done. Keeps Skip/Done paired with their own
// context (per the location_request_message bubble not supporting extra
// buttons anyway) while still surfacing the escape hatch on every step.
export async function sendNavigationOptionsReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getNavigationOptionsMessage(),
    getNavigationButtons()
  );
}

// Sent when Main Menu / Cancel / Language is attempted mid-complaint --
// asks for explicit confirmation before the draft is cancelled, since
// abandoning mid-flow is a destructive action (loses progress).
export async function sendAbandonConfirmationReply(
  phoneNumberId: string,
  to: string,
  target: AbandonTarget
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getAbandonConfirmationMessage(),
    getAbandonConfirmationButtons(target)
  );
}

export async function sendComplaintFlowReply(
  phoneNumberId: string,
  to: string,
  draftComplaintId: number,
  body: string = "Please fill this complaint form. It will only take a minute."
): Promise<void> {
  await sendFlowMessage(
    phoneNumberId,
    to,
    env.complaintFlowId,
    body,
    "Open complaint form",
    `complaint_draft_${draftComplaintId}`
  );
}

export async function sendMediaReminderReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getMediaReminderMessage(),
    getComplaintMediaButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

export async function sendMediaUploadedReply(
  phoneNumberId: string,
  to: string,
  remainingSlots: number
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getMediaUploadedMessage(remainingSlots),
    getComplaintMediaButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

export async function sendMediaLimitReachedReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getMediaLimitReachedMessage(),
    getComplaintMediaButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

export async function sendMediaUnsupportedTypeReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getMediaUnsupportedTypeMessage(),
    getComplaintMediaButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

export async function sendComplaintDetailsSavedReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendLocationRequestMessage(
    phoneNumberId,
    to,
    getLocationRequestMessage()
  );

  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getLocationSkipFollowUpMessage(),
    getLocationSkipButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

export async function sendLocationReminderReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getLocationReminderMessage(),
    getLocationSkipButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

// locationShared distinguishes the two ways a caller can arrive at the
// media step -- either they shared a location or pressed Skip -- so the
// acknowledgement message can reflect which one actually happened.
export async function sendMediaStepEntryReply(
  phoneNumberId: string,
  to: string,
  locationShared: boolean
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    locationShared ? getLocationSavedMessage() : getLocationSkippedMessage(),
    getComplaintMediaButtons()
  );

  await sendNavigationOptionsReply(phoneNumberId, to);
}

// Sent when the citizen taps Done -- the real "your complaint is now
// officially submitted" moment, and the first time they see a complaint
// number at all.
export async function sendComplaintFinalizedReply(
  phoneNumberId: string,
  to: string,
  complaintNumber: string
): Promise<void> {
  await sendTextMessage(phoneNumberId, to, getComplaintFinalizedMessage(complaintNumber));
  await sendMainMenuReply(phoneNumberId, to);
}

// Sent when the 5-file media limit itself triggers finalization -- no Done
// tap involved, so the message combines the upload acknowledgement with
// the finalization confirmation in one go.
export async function sendComplaintFinalizedAfterLimitReply(
  phoneNumberId: string,
  to: string,
  complaintNumber: string
): Promise<void> {
  await sendTextMessage(phoneNumberId, to, getComplaintFinalizedAfterLimitMessage(complaintNumber));
  await sendMainMenuReply(phoneNumberId, to);
}