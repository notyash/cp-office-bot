import {
  COMPLAINT_FLOW_STEPS,
} from "../../constants/complaints.js";

import {
  sendPromptWithNavigation,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";
import { handlePoliceStationSelectionMethod, handlePoliceStationSelection, handleFullNameCollection, handlePhoneCollection } from "./complaintStepHandlers.js";

export async function handleComplaintFlow(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context, input } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot handle complaint flow because senderWaId is missing");
    return;
  }

    switch (context.session.active_step) {
    case COMPLAINT_FLOW_STEPS.SELECT_POLICE_STATION_METHOD:
        await handlePoliceStationSelectionMethod(handlerContext);
        return;

    case COMPLAINT_FLOW_STEPS.SELECT_POLICE_STATION:
        await handlePoliceStationSelection(handlerContext);
        return;

    case COMPLAINT_FLOW_STEPS.COLLECT_FULL_NAME:
        await handleFullNameCollection(handlerContext);
        return;

    case COMPLAINT_FLOW_STEPS.COLLECT_PHONE:
      await handlePhoneCollection(handlerContext);
      return;

    default:
        console.log(
        "No complaint flow handler matched active_step:",
        context.session.active_step
        );

        await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Complaint flow will continue here next.",
        "File Complaint"
        );

        return;
    }
}
