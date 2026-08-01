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
  getComplaintSubmittedMessage,
  getMediaLimitReachedMessage,
  getMediaReminderMessage,
  getMediaUnsupportedTypeMessage,
  getMediaUploadedMessage,
} from "../messages/mediaMessages.js";

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
  draftComplaintId: number
): Promise<void> {
  await sendFlowMessage(
    phoneNumberId,
    to,
    env.complaintFlowId,
    "Please fill this complaint form. It will only take a minute.",
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
    getComplaintSubmittedMessage(complaintNumber),
    getComplaintMediaButtons(),
    "Main Menu"
  );
}