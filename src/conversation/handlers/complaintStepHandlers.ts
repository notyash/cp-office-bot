import { COMPLAINT_FLOW_STEPS } from "../../constants/complaints.js";
import { updateSessionProgress } from "../../db/repositories/sessionRepository.js";
import { submitComplaint } from "../../services/complaintService.js";

import { ConversationHandlerContext } from "./handlerContext.js";

import {
    sendPromptWithNavigation,
} from "../replyService.js";

function hasReplyTarget(
    handlerContext: ConversationHandlerContext
    // a TS guard saying "If this function returns true, then TypeScript can treat handlerContext as a ConversationHandlerContext where
    // dto.senderWaId is definitely a string."
): handlerContext is ConversationHandlerContext & {
    dto: ConversationHandlerContext["dto"] & { // keep the original dto
        senderWaId: string; // but narrow senderWaId from optional string | undefined to required string.
    };
} {
    return Boolean(handlerContext.dto.senderWaId);
}

async function sendDraftErrorReply(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        return;
    }

    const { dto } = handlerContext;

    await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Something went wrong with your complaint draft. Please go back to main menu and try again.",
        "File Complaint"
    );
}

export async function handleFlowSubmission(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        console.log("Cannot handle flow submission because senderWaId is missing");
        return;
    }

    const { pool, dto, context } = handlerContext;

    if (!context.session.draft_complaint_id) {
        console.log("Missing draft_complaint_id in flow submission step");
        await sendDraftErrorReply(handlerContext);
        return;
    }

    if (!dto.flowResponse) {
        // Session is sitting at AWAITING_FLOW_SUBMISSION but this message
        // isn't an nfm_reply -- the user backed out of the Flow or sent
        // something else instead. Re-prompt rather than silently failing.
        await sendPromptWithNavigation(
            dto.botPhoneNumberId,
            dto.senderWaId,
            "Please complete the complaint form to continue, or use the button below to go back.",
            "File Complaint"
        );
        return;
    }

    const result = await submitComplaint(
        pool,
        context.session.draft_complaint_id,
        dto.flowResponse
    );

    if (!result.success) {
        if (result.reason === "ALREADY_SUBMITTED") {
            // Duplicate webhook delivery for a submission already processed.
            // Meta retries webhooks; this is expected, not an error --
            // stay silent rather than sending a second confirmation.
            console.log(
                "Duplicate flow submission for complaint:",
                context.session.draft_complaint_id
            );
            return;
        }

        console.log("Flow submission validation failed:", result.errors);

        await sendPromptWithNavigation(
            dto.botPhoneNumberId,
            dto.senderWaId,
            "Some details in your complaint form couldn't be saved. Please try filing again.",
            "File Complaint"
        );
        return;
    }

    await updateSessionProgress(
        pool,
        context.session.id,
        COMPLAINT_FLOW_STEPS.AWAITING_MEDIA_SUBMISSION,
        context.session.draft_complaint_id
    );

    await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        `Your complaint has been submitted. Complaint number: ${result.complaint.complaint_number}. `
            + `You can now send photos or videos related to your complaint, or type "done" if you have nothing to add.`,
        "Main Menu"
    );
}