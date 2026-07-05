import { SESSION_STATES } from "../../constants/sessionStates.js";

import {
  clearSessionProgress,
  updateSessionState,
} from "../../db/repositories/sessionRepository.js";

import {
  sendLanguageSelectionReply,
  sendMainMenuReply,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";

export function isMainMenuCommand(text: string | undefined): boolean {
  const normalized = text?.trim().toLowerCase();

  return [
    "menu",
    "main menu",
    "main_menu",
    "cancel",
    "go_to_main_menu",
  ].includes(normalized ?? "");
}

export function isBackCommand(text: string | undefined): boolean {
  const normalized = text?.trim().toLowerCase();

  return ["back", "go_back"].includes(normalized ?? "");
}

export function isChangeLanguageCommand(text: string | undefined): boolean {
  const normalized = text?.trim().toLowerCase();

  return [
    "language",
    "change language",
    "reselect language",
    "change_language",
  ].includes(normalized ?? "");
}

export async function handleChangeLanguageCommand(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot change language because senderWaId is missing");
    return;
  }

  await updateSessionState(
    pool,
    context.session.id,
    SESSION_STATES.WAITING_FOR_LANGUAGE,
    null
  );

  await clearSessionProgress(pool, context.session.id);

  await sendLanguageSelectionReply(dto.botPhoneNumberId, dto.senderWaId);
}

export async function handleMainMenuCommand(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot go to main menu because senderWaId is missing");
    return;
  }

  await updateSessionState(
    pool,
    context.session.id,
    SESSION_STATES.READY,
    null
  );

  await clearSessionProgress(pool, context.session.id);

  await sendMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
}

export async function handleBackCommand(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot go back because senderWaId is missing");
    return;
  }

  // Temporary behavior until we add real previous-step navigation.
  // For now, Back exits the current flow and returns to main menu.
  await updateSessionState(
    pool,
    context.session.id,
    SESSION_STATES.READY,
    null
  );

  await clearSessionProgress(pool, context.session.id);

  await sendMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
}