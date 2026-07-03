import { Pool } from "pg";
import { IncomingMessageDto } from "../types/incomingMessageDto.js";
import { SessionContext } from "../session/sessionService.js";

import { SESSION_STATES } from "../constants/sessionStates.js";
import { INTENTS } from "../constants/intents.js";

import { sendTextMessage } from "../whatsapp/whatsappClient.js";

import { parseLanguageSelection } from "../services/languageService.js";
import {
  getNextStateForIntent,
  parseMainMenuIntent,
} from "../services/intentService.js";

import { updateUserLanguage } from "../db/repositories/userRepository.js";
import {
  updateSessionIntent,
  updateSessionState,
} from "../db/repositories/sessionRepository.js";

import {
  getLanguageSavedMessage,
  getLanguageSelectionMessage,
} from "../messages/languageMessages.js";

import {
  getInvalidMainMenuMessage,
  getMainMenuMessage,
} from "../messages/menuMessages.js";

import { getComplaintDescriptionPrompt } from "../messages/complaintMessages.js";
import { getComplaintIdPrompt } from "../messages/statusMessages.js";

import {
  getGeneralQuestionComingSoonMessage,
  getParkingComingSoonMessage,
  getPoliceStationFinderComingSoonMessage,
} from "../messages/placeholderMessages.js";
import { getIncomingMessageInput } from "../services/messageInputService.js";

function isMainMenuCommand(text: string | undefined): boolean {
  const normalized = text?.trim().toLowerCase();

  return [
    "menu",
    "main menu",
    "main_menu",
    "back",
    "cancel",
    "back_to_menu",
    "go_to_main_menu",
  ].includes(normalized ?? "");
}

export async function handleIncomingConversationMessage(pool: Pool, dto: IncomingMessageDto, context: SessionContext): Promise<void> {
    if (!dto.senderWaId) {
        console.log("Cannot reply because senderWaId is missing");
        return;
    }

    const input = getIncomingMessageInput(dto);

    if (isMainMenuCommand(input)) {
        await updateSessionIntent(pool, context.session.id, null);
        await updateSessionState(pool, context.session.id, SESSION_STATES.READY, null);

        await sendTextMessage(
        dto.botPhoneNumberId,
        dto.senderWaId,
        getMainMenuMessage()
        );

        return;
    }

    if (context.session.state === SESSION_STATES.WAITING_FOR_LANGUAGE) {
        const selectedLanguage = parseLanguageSelection(input);

        if (!selectedLanguage) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getLanguageSelectionMessage()
        );

        return;
        }

        await updateUserLanguage(pool, context.user.id, selectedLanguage);
        await updateSessionState(pool, context.session.id, SESSION_STATES.READY);

        await sendTextMessage(
        dto.botPhoneNumberId,
        dto.senderWaId,
        `${getLanguageSavedMessage()}\n\n${getMainMenuMessage()}`
        );

        return;
    }

    if (context.session.state === SESSION_STATES.READY) {
        const intent = parseMainMenuIntent(input);

        console.log("Selected intent:", intent);

        if (intent === INTENTS.UNKNOWN) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getInvalidMainMenuMessage()
        );

        return;
        }

        await updateSessionIntent(pool, context.session.id, intent);

        const nextState = getNextStateForIntent(intent);

        await updateSessionState(pool, context.session.id, nextState, intent);

        if (intent === INTENTS.FILE_COMPLAINT) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getComplaintDescriptionPrompt()
        );

        return;
        }

        if (intent === INTENTS.CHECK_COMPLAINT_STATUS) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getComplaintIdPrompt()
        );

        return;
        }

        if (intent === INTENTS.FIND_POLICE_STATION) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getPoliceStationFinderComingSoonMessage()
        );

        return;
        }

        if (intent === INTENTS.FIND_PARKING) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getParkingComingSoonMessage()
        );

        return;
        }

        if (intent === INTENTS.GENERAL_QNA) {
        await sendTextMessage(
            dto.botPhoneNumberId,
            dto.senderWaId,
            getGeneralQuestionComingSoonMessage()
        );

        return;
        }
    }

    console.log("No conversation handler matched state:", context.session.state);
}