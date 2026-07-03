import { SESSION_STATES, SessionState } from "../../constants/sessionStates.js";
import { sendPromptWithNavigation } from "../replyService.js";
import { ConversationHandlerContext } from "./handlerContext.js";

export async function handlePlaceholderFlow(
  handlerContext: ConversationHandlerContext,
  state: SessionState
): Promise<void> {
  const { dto } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot handle placeholder flow because senderWaId is missing");
    return;
  }

  switch (state) {
    case SESSION_STATES.IN_COMPLAINT_FLOW:
      await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Complaint filing flow will continue here next.",
        "File Complaint"
      );
      return;

    case SESSION_STATES.CHECKING_COMPLAINT_STATUS:
      await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Complaint status flow will continue here next.",
        "Complaint Status"
      );
      return;

    default:
      console.log("No placeholder flow matched state:", state);
      return;
  }
}