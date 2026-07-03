import { SESSION_STATES } from "../../constants/sessionStates.js";
import { updateUserLanguage } from "../../db/repositories/userRepository.js";
import { updateSessionState } from "../../db/repositories/sessionRepository.js";
import { parseLanguageSelection } from "../../services/languageService.js";

import {
  sendLanguageSavedAndMainMenuReply,
  sendLanguageSelectionReply,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";

export async function handleLanguageSelection(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context, input } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot handle language selection because senderWaId is missing");
    return;
  }

  const selectedLanguage = parseLanguageSelection(input);

  if (!selectedLanguage) {
    await sendLanguageSelectionReply(dto.botPhoneNumberId, dto.senderWaId);
    return;
  }

  await updateUserLanguage(pool, context.user.id, selectedLanguage);

  await updateSessionState(
    pool,
    context.session.id,
    SESSION_STATES.READY,
    null
  );

  await sendLanguageSavedAndMainMenuReply(
    dto.botPhoneNumberId,
    dto.senderWaId
  );
}