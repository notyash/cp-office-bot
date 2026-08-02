import {
    COMPLAINT_FLOW_STEPS,
} from "../../constants/complaints.js";

import {
    sendPromptWithNavigation,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";
import { handleFlowSubmission, handleLocationSubmission, handleMediaSubmission } from "./complaintStepHandlers.js";

export async function handleComplaintFlow(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    const { dto, context } = handlerContext;

    if (!dto.senderWaId) {
        console.log("Cannot handle complaint flow because senderWaId is missing");
        return;
    }

    switch (context.session.active_step) {
        case COMPLAINT_FLOW_STEPS.AWAITING_FLOW_SUBMISSION:
            await handleFlowSubmission(handlerContext);
            return;

        case COMPLAINT_FLOW_STEPS.AWAITING_LOCATION_SUBMISSION:
            await handleLocationSubmission(handlerContext);
            return;

        case COMPLAINT_FLOW_STEPS.AWAITING_MEDIA_SUBMISSION:
            await handleMediaSubmission(handlerContext);
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