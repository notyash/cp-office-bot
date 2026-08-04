import { Pool } from "pg";
import { IncomingMessageDto } from "../types/incomingMessageDto.js";
import { SessionContext } from "../session/sessionService.js";
import { SESSION_STATES } from "../constants/sessionStates.js";
import { getIncomingMessageInput } from "../services/messageInputService.js";
import { handleComplaintFlow } from "./handlers/complaintFlowHandler.js";
import { handleComplaintFlowBackCommand } from "./handlers/complaintStepHandlers.js";
import { handleLanguageSelection } from "./handlers/languageHandler.js";
import { handleMainMenuSelection } from "./handlers/mainMenuHandler.js";
import { handlePlaceholderFlow } from "./handlers/placeholderFlowHandler.js";

import {
  handleBackCommand,
  handleChangeLanguageCommand,
  handleMainMenuCommand,
  isBackCommand,
  isChangeLanguageCommand,
  isMainMenuCommand,
} from "./handlers/navigationHandler.js";
import { updateSessionState } from "../db/repositories/sessionRepository.js";
import {
  sendComplaintFlowReply,
  sendLanguageSelectionReply,
  sendMainMenuReply,
} from "./replyService.js";

export async function handleIncomingConversationMessage(
  pool: Pool,
  dto: IncomingMessageDto,
  context: SessionContext
): Promise<void> {
  if (!dto.senderWaId) {
    console.log("Cannot reply because senderWaId is missing");
    return;
  }

  const input = getIncomingMessageInput(dto);

  const handlerContext = {
    pool,
    dto,
    context,
    input,
  };

  if (
      !context.user.preferred_language &&
      context.session.state !== SESSION_STATES.WAITING_FOR_LANGUAGE
  ) {
      await updateSessionState(
          pool,
          context.session.id,
          SESSION_STATES.WAITING_FOR_LANGUAGE,
          null
      );

      await sendLanguageSelectionReply(dto.botPhoneNumberId, dto.senderWaId);
      return;
  }

  // A brand new session was just silently created in place of one that
  // expired (or simply didn't exist -- e.g. a returning citizen whose
  // last session ended normally days ago). Whatever they just typed was
  // never meant as a command against this stateless, fresh session -- it
  // was addressed to whatever state they thought they were still in.
  // Greet them properly instead of judging that message against READY's
  // menu-selection logic and risking a confusing "not a valid option".
  if (context.isNewSession && context.session.state === SESSION_STATES.READY) {
    await sendMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
    return;
  }

  // Global commands override every session state.
  if (isChangeLanguageCommand(input)) {
    await handleChangeLanguageCommand(handlerContext);
    return;
  }

  if (isBackCommand(input)) {
    // Back means different things depending on where the citizen is --
    // real per-step navigation inside the complaint flow, vs. the generic
    // "exit to main menu" behavior everywhere else.
    if (context.session.state === SESSION_STATES.IN_COMPLAINT_FLOW) {
      await handleComplaintFlowBackCommand(handlerContext);
    } else {
      await handleBackCommand(handlerContext);
    }
    return;
  }

  if (isMainMenuCommand(input)) {
    await handleMainMenuCommand(handlerContext);
    return;
  }

  switch (context.session.state) {
    case SESSION_STATES.WAITING_FOR_LANGUAGE:
      await handleLanguageSelection(handlerContext);
      return;

    case SESSION_STATES.READY:
      await handleMainMenuSelection(handlerContext);
      return;

    case SESSION_STATES.IN_COMPLAINT_FLOW:
      await handleComplaintFlow(handlerContext);
      return;

    case SESSION_STATES.CHECKING_COMPLAINT_STATUS:
      await handlePlaceholderFlow(handlerContext, context.session.state);
      return;

    case SESSION_STATES.ENDED:
      console.log("Received message for ended session:", context.session.id);
      return;

    default:
      console.log("No conversation handler matched state:", context.session.state);
      return;
  }
}