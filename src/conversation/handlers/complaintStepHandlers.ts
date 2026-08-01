import { COMPLAINT_FLOW_STEPS } from "../../constants/complaints.js";

import {
    clearSessionProgress,
    updateSessionProgress,
    updateSessionState,
} from "../../db/repositories/sessionRepository.js";

import { SESSION_STATES } from "../../constants/sessionStates.js";

import { submitComplaint } from "../../services/complaintService.js";

import {
    isSupportedMediaMessageType,
    submitComplaintMedia,
} from "../../services/complaintMediaService.js";

import { COMPLAINT_DONE_BUTTON_ID } from "../../messages/mediaMessages.js";

import { ConversationHandlerContext } from "./handlerContext.js";

import {
    sendComplaintSubmittedReply,
    sendMainMenuReply,
    sendMediaLimitReachedReply,
    sendMediaReminderReply,
    sendMediaUnsupportedTypeReply,
    sendMediaUploadedReply,
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
    console.log(JSON.stringify(dto.flowResponse))

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

    if (!result.complaint.complaint_number) {
        // Should be impossible: submitComplaintFromFlow always assigns a
        // number via complaint_number_seq on success. Logged loudly rather
        // than silently sending "Complaint number: null" to a citizen.
        console.log(
            "Submitted complaint is missing a complaint_number:",
            result.complaint.id
        );
        await sendDraftErrorReply(handlerContext);
        return;
    }

    await sendComplaintSubmittedReply(
        dto.botPhoneNumberId,
        dto.senderWaId,
        result.complaint.complaint_number
    );
}

export async function handleMediaSubmission(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        console.log("Cannot handle media submission because senderWaId is missing");
        return;
    }

    const { pool, dto, context } = handlerContext;

    if (!context.session.draft_complaint_id) {
        console.log("Missing draft_complaint_id in media submission step");
        await sendDraftErrorReply(handlerContext);
        return;
    }

    // "Done" tapped -- the whole complaint (details + media) is complete.
    // Close out the flow entirely and hand control back to the main menu.
    if (dto.buttonReplyId === COMPLAINT_DONE_BUTTON_ID) {
        await updateSessionState(pool, context.session.id, SESSION_STATES.READY, null);
        await clearSessionProgress(pool, context.session.id);

        await sendMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
        return;
    }

    // A media message -- attempt to store it against this complaint.
    if (isSupportedMediaMessageType(dto.type)) {
        const result = await submitComplaintMedia(
            pool,
            context.session.draft_complaint_id,
            dto.type,
            dto.mediaId,
            dto.mediaMimeType
        );

        if (!result.success) {
            if (result.reason === "LIMIT_REACHED") {
                await sendMediaLimitReachedReply(dto.botPhoneNumberId, dto.senderWaId);
                return;
            }

            // UNSUPPORTED_TYPE -- shouldn't normally happen since
            // isSupportedMediaMessageType already gated this branch, but
            // kept as a safety net in case the two lists ever drift apart.
            await sendMediaUnsupportedTypeReply(dto.botPhoneNumberId, dto.senderWaId);
            return;
        }

        await sendMediaUploadedReply(
            dto.botPhoneNumberId,
            dto.senderWaId,
            result.remainingSlots
        );
        return;
    }

    // Anything else -- plain text, location, etc. -- gets steered back
    // toward attaching media or pressing Done, per the hard-gate design:
    // nothing else is processed while this step is active.
    await sendMediaReminderReply(dto.botPhoneNumberId, dto.senderWaId);
} 