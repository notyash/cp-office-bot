import {
  sendListMessage,
  sendReplyButtonsMessage,
  sendTextMessage,
} from "../whatsapp/whatsappClient.js";

import {
  getPoliceStationMethodMessage,
  getPoliceStationMethodSections,
} from "../messages/complaintMessages.js";

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
import { DbPoliceStation } from "../db/repositories/policeStationRepository.js";

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

export async function sendPoliceStationMethodReply(
  phoneNumberId: string,
  to: string
): Promise<void> {
  await sendListMessage(
    phoneNumberId,
    to,
    getPoliceStationMethodMessage(),
    "Choose option",
    getPoliceStationMethodSections(),
    "File Complaint"
  );
}

export async function sendPoliceStationListReply(
  phoneNumberId: string,
  to: string,
  policeStations: DbPoliceStation[]
): Promise<void> {
  await sendListMessage(
    phoneNumberId,
    to,
    "Please select the police station for your complaint.",
    "Select station",
    [
      {
        title: "Available Stations",
        rows: policeStations.map((station) => ({
          id: `POLICE_STATION_${station.id}`,
          title: station.name,
          description:
            station.jurisdiction_area ??
            station.address ??
            station.city ??
            "Police station",
        })),
      },
    ],
    "File Complaint"
  );
}