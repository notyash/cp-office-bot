import {
  sendListMessage,
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

import { getNavigationButtons } from "../messages/navigationMessages.js";

import {
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
} from "../messages/locationMessages.js";

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
}

export async function sendComplaintSubmittedReply(
  phoneNumberId: string,
  to: string,
  complaintNumber: string
): Promise<void> {
  await sendReplyButtonsMessage(
    phoneNumberId,
    to,
    getLocationRequestMessage(complaintNumber),
    getLocationSkipButtons(),
    "Main Menu"
  );
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
}