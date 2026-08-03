import { SESSION_STATES } from "../../constants/sessionStates.js";
import { COMPLAINT_FLOW_STEPS } from "../../constants/complaints.js";

import {
  clearSessionProgress,
  updateSessionProgress,
  updateSessionState,
} from "../../db/repositories/sessionRepository.js";

import {
  sendAbandonConfirmationReply,
  sendLanguageSelectionReply,
  sendMainMenuReply,
} from "../replyService.js";

import { AbandonTarget } from "../../messages/abandonMessages.js";

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

// Main Menu/Cancel/Language are destructive mid-complaint (they'd abandon
// an in-progress draft), so they route through an explicit confirmation
// step instead of executing immediately when this is true.
function isMidComplaintFlow(handlerContext: ConversationHandlerContext): boolean {
  return (
    handlerContext.context.session.state === SESSION_STATES.IN_COMPLAINT_FLOW
    && handlerContext.context.session.draft_complaint_id !== null
  );
}

// Parks the session at AWAITING_ABANDON_CONFIRMATION and asks the citizen
// to confirm before actually cancelling the draft -- see
// complaintStepHandlers.ts:handleAbandonConfirmationStep for what happens
// on confirm/decline.
async function promptAbandonConfirmation(
  handlerContext: ConversationHandlerContext,
  target: AbandonTarget
): Promise<void> {
  const { pool, dto, context } = handlerContext;

  if (!dto.senderWaId || !context.session.draft_complaint_id) {
    return;
  }

  await updateSessionProgress(
    pool,
    context.session.id,
    COMPLAINT_FLOW_STEPS.AWAITING_ABANDON_CONFIRMATION,
    context.session.draft_complaint_id
  );

  await sendAbandonConfirmationReply(dto.botPhoneNumberId, dto.senderWaId, target);
}

export async function handleChangeLanguageCommand(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot change language because senderWaId is missing");
    return;
  }

  if (isMidComplaintFlow(handlerContext)) {
    await promptAbandonConfirmation(handlerContext, "LANGUAGE");
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

  if (isMidComplaintFlow(handlerContext)) {
    await promptAbandonConfirmation(handlerContext, "MENU");
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

  // Only reached outside the complaint flow now -- Back mid-complaint is
  // handled by handleComplaintFlowBackCommand in complaintStepHandlers.ts,
  // which does real per-step navigation instead of this generic exit.
  await updateSessionState(
    pool,
    context.session.id,
    SESSION_STATES.READY,
    null
  );

  await clearSessionProgress(pool, context.session.id);

  await sendMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
}