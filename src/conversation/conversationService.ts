import { Pool } from "pg";
import { IncomingMessageDto } from "../types/incomingMessageDto.js";
import { SessionContext } from "../session/sessionService.js";
import { SESSION_STATES } from "../constants/sessionStates.js";
import { getIncomingMessageInput } from "../services/messageInputService.js";
import { handleComplaintFlow } from "./handlers/complaintFlowHandler.js";
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
import { sendComplaintFlowReply, sendLanguageSelectionReply } from "./replyService.js";

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
  // Global commands override every session state.
  if (isChangeLanguageCommand(input)) {
    await handleChangeLanguageCommand(handlerContext);
    return;
  }

  if (isBackCommand(input)) {
    await handleBackCommand(handlerContext);
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