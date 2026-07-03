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