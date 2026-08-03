import {
    COMPLAINT_FLOW_STEPS,
    COMPLAINT_LOCATION_SOURCES,
} from "../../constants/complaints.js";

import {
    clearSessionProgress,
    updateSessionProgress,
    updateSessionState,
} from "../../db/repositories/sessionRepository.js";

import { SESSION_STATES } from "../../constants/sessionStates.js";

import {
    cancelComplaint,
    submitComplaint,
    finalizeComplaint,
} from "../../services/complaintService.js";

import {
    isSupportedMediaMessageType,
    submitComplaintMedia,
} from "../../services/complaintMediaService.js";

import {
    getComplaintLocationByComplaintId,
    upsertComplaintLocation,
} from "../../db/repositories/complaintLocationRepository.js";

import { COMPLAINT_DONE_BUTTON_ID } from "../../messages/mediaMessages.js";
import { COMPLAINT_LOCATION_SKIP_BUTTON_ID } from "../../messages/locationMessages.js";

import {
    ABANDON_KEEP_GOING_BUTTON_ID,
    CONFIRM_ABANDON_LANGUAGE_BUTTON_ID,
    CONFIRM_ABANDON_MENU_BUTTON_ID,
} from "../../messages/abandonMessages.js";

import { ConversationHandlerContext } from "./handlerContext.js";
import { handleMainMenuCommand } from "./navigationHandler.js";

import {
    sendAbandonConfirmationReply,
    sendComplaintDetailsSavedReply,
    sendComplaintFinalizedAfterLimitReply,
    sendComplaintFinalizedReply,
    sendComplaintFlowReply,
    sendLanguageSelectionReply,
    sendLocationReminderReply,
    sendMainMenuReply,
    sendMediaLimitReachedReply,
    sendMediaReminderReply,
    sendMediaStepEntryReply,
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
        // something else instead. Resend the Flow directly rather than
        // making them navigate back to the main menu and re-select
        // "File Complaint" to get here again.
        await sendComplaintFlowReply(
            dto.botPhoneNumberId,
            dto.senderWaId,
            context.session.draft_complaint_id
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
        if (result.reason === "ALREADY_FINALIZED") {
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

        await sendComplaintFlowReply(
            dto.botPhoneNumberId,
            dto.senderWaId,
            context.session.draft_complaint_id,
            "Some details in your complaint form couldn't be saved. Please try filing again."
        );
        return;
    }

    await updateSessionProgress(
        pool,
        context.session.id,
        COMPLAINT_FLOW_STEPS.AWAITING_LOCATION_SUBMISSION,
        context.session.draft_complaint_id
    );

    // No complaint_number yet, and none is shown to the citizen at this
    // stage -- the complaint isn't officially finalized until they tap
    // Done or hit the media upload limit (see finalizeComplaint).
    await sendComplaintDetailsSavedReply(dto.botPhoneNumberId, dto.senderWaId);
}

export async function handleLocationSubmission(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        console.log("Cannot handle location submission because senderWaId is missing");
        return;
    }

    const { pool, dto, context } = handlerContext;

    if (!context.session.draft_complaint_id) {
        console.log("Missing draft_complaint_id in location submission step");
        await sendDraftErrorReply(handlerContext);
        return;
    }

    // "Skip" tapped -- move straight to the media step without storing
    // anything in complaint_locations.
    if (dto.buttonReplyId === COMPLAINT_LOCATION_SKIP_BUTTON_ID) {
        await updateSessionProgress(
            pool,
            context.session.id,
            COMPLAINT_FLOW_STEPS.AWAITING_MEDIA_SUBMISSION,
            context.session.draft_complaint_id
        );

        await sendMediaStepEntryReply(dto.botPhoneNumberId, dto.senderWaId, false);
        return;
    }

    // A location message -- store it and move to the media step. Only
    // WHATSAPP_LOCATION is used for now (see complaints.ts: live location
    // isn't reliably distinguishable/deliverable via the Cloud API yet).
    if (
        dto.type === "location"
        && dto.latitude !== undefined
        && dto.longitude !== undefined
    ) {
        await upsertComplaintLocation(
            pool,
            context.session.draft_complaint_id,
            COMPLAINT_LOCATION_SOURCES.WHATSAPP_LOCATION,
            dto.latitude,
            dto.longitude
        );

        await updateSessionProgress(
            pool,
            context.session.id,
            COMPLAINT_FLOW_STEPS.AWAITING_MEDIA_SUBMISSION,
            context.session.draft_complaint_id
        );

        await sendMediaStepEntryReply(dto.botPhoneNumberId, dto.senderWaId, true);
        return;
    }

    // Anything else -- plain text, media sent too early, etc. -- gets
    // steered back toward sharing location or pressing Skip, same hard-gate
    // pattern as the media step.
    await sendLocationReminderReply(dto.botPhoneNumberId, dto.senderWaId);
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

    // "Done" tapped -- the whole complaint (details + location + media) is
    // complete. This is the actual "official submission" moment: generate
    // the complaint number, then close out the flow and hand control back
    // to the main menu.
    if (dto.buttonReplyId === COMPLAINT_DONE_BUTTON_ID) {
        const finalizeResult = await finalizeComplaint(pool, context.session.draft_complaint_id);

        await updateSessionState(pool, context.session.id, SESSION_STATES.READY, null);
        await clearSessionProgress(pool, context.session.id);

        if (!finalizeResult.success) {
            // ALREADY_FINALIZED -- a duplicate webhook for a Done tap
            // already processed (e.g. the auto-finalize-at-limit path beat
            // this one to it, or Meta retried the webhook). Session state
            // is still safe to reset above; just don't send a second
            // finalized confirmation.
            console.log(
                "Complaint already finalized, skipping duplicate confirmation:",
                context.session.draft_complaint_id
            );
            return;
        }

        if (!finalizeResult.complaint.complaint_number) {
            // Should be impossible: finalizeComplaintSubmission always
            // assigns a number via complaint_number_seq on success. Logged
            // loudly rather than silently sending a blank number to a citizen.
            console.log(
                "Finalized complaint is missing a complaint_number:",
                finalizeResult.complaint.id
            );
            return;
        }

        await sendComplaintFinalizedReply(
            dto.botPhoneNumberId,
            dto.senderWaId,
            finalizeResult.complaint.complaint_number
        );
        return;
    }

    // A media message -- attempt to store it against this complaint.
    if (isSupportedMediaMessageType(dto.type)) {
        const result = await submitComplaintMedia(
            pool,
            context.session.draft_complaint_id,
            dto.type,
            dto.mediaId,
            dto.mediaMimeType,
            dto.mediaSha256
        );

        if (!result.success) {
            if (result.reason === "LIMIT_REACHED") {
                // Normally unreachable in practice now -- the 5th successful
                // upload auto-finalizes and moves the session to READY
                // below, so a 6th attempt shouldn't land in this handler at
                // all. Kept as a defensive fallback for a race (e.g. two
                // uploads arriving near-simultaneously before the session
                // transition commits).
                await sendMediaLimitReachedReply(dto.botPhoneNumberId, dto.senderWaId);
                return;
            }

            // UNSUPPORTED_TYPE -- shouldn't normally happen since
            // isSupportedMediaMessageType already gated this branch, but
            // kept as a safety net in case the two lists ever drift apart.
            await sendMediaUnsupportedTypeReply(dto.botPhoneNumberId, dto.senderWaId);
            return;
        }

        if (result.remainingSlots === 0) {
            // The 5-file limit is now reached -- auto-finalize rather than
            // waiting for a separate Done tap, since there's nothing more
            // the citizen can add anyway. Skips the normal "uploaded"
            // acknowledgement entirely (its wording says "press Done",
            // which would contradict auto-finalizing here) in favor of the
            // combined finalized-after-limit message below.
            const finalizeResult = await finalizeComplaint(pool, context.session.draft_complaint_id);

            await updateSessionState(pool, context.session.id, SESSION_STATES.READY, null);
            await clearSessionProgress(pool, context.session.id);

            if (!finalizeResult.success) {
                console.log(
                    "Complaint already finalized, skipping duplicate confirmation:",
                    context.session.draft_complaint_id
                );
                return;
            }

            if (!finalizeResult.complaint.complaint_number) {
                console.log(
                    "Finalized complaint is missing a complaint_number:",
                    finalizeResult.complaint.id
                );
                return;
            }

            await sendComplaintFinalizedAfterLimitReply(
                dto.botPhoneNumberId,
                dto.senderWaId,
                finalizeResult.complaint.complaint_number
            );
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

// Shared between handleAbandonConfirmationStep's "Keep going" branch and
// handleComplaintFlowBackCommand's AWAITING_ABANDON_CONFIRMATION case --
// both mean the same thing ("don't abandon, resume where I was"), so both
// call this instead of one faking a button tap to reach the other.
// Re-derives the resume point from complaint_locations rather than a
// persisted "pending step" field, since it's fully reconstructable from
// data that already exists (see design notes).
async function resumeAfterAbandonDecline(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        console.log("Cannot resume after abandon decline because senderWaId is missing");
        return;
    }

    const { pool, dto, context } = handlerContext;

    if (!context.session.draft_complaint_id) {
        console.log("Missing draft_complaint_id in abandon decline resume");
        await sendDraftErrorReply(handlerContext);
        return;
    }

    const draftComplaintId = context.session.draft_complaint_id;
    const existingLocation = await getComplaintLocationByComplaintId(pool, draftComplaintId);

    if (existingLocation) {
        await updateSessionProgress(
            pool,
            context.session.id,
            COMPLAINT_FLOW_STEPS.AWAITING_MEDIA_SUBMISSION,
            draftComplaintId
        );

        // Reminder, not the "entry" message -- the entry message implies
        // location was *just* shared, which would be misleading here since
        // we're resuming, not arriving fresh.
        await sendMediaReminderReply(dto.botPhoneNumberId, dto.senderWaId);
        return;
    }

    await updateSessionProgress(
        pool,
        context.session.id,
        COMPLAINT_FLOW_STEPS.AWAITING_LOCATION_SUBMISSION,
        draftComplaintId
    );

    await sendLocationReminderReply(dto.botPhoneNumberId, dto.senderWaId);
}

// Handles the AWAITING_ABANDON_CONFIRMATION step -- reached when the
// citizen tried Main Menu/Cancel/Language mid-complaint (see
// navigationHandler.ts:promptAbandonConfirmation).
export async function handleAbandonConfirmationStep(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        console.log("Cannot handle abandon confirmation because senderWaId is missing");
        return;
    }

    const { pool, dto, context } = handlerContext;

    if (!context.session.draft_complaint_id) {
        console.log("Missing draft_complaint_id in abandon confirmation step");
        await sendDraftErrorReply(handlerContext);
        return;
    }

    const draftComplaintId = context.session.draft_complaint_id;

    if (
        dto.buttonReplyId === CONFIRM_ABANDON_MENU_BUTTON_ID
        || dto.buttonReplyId === CONFIRM_ABANDON_LANGUAGE_BUTTON_ID
    ) {
        const cancelResult = await cancelComplaint(pool, draftComplaintId);

        if (!cancelResult.success) {
            // ALREADY_FINALIZED -- a race where the complaint was already
            // finalized or cancelled by something else (e.g. the media
            // limit auto-finalized it) before this confirm landed. The
            // draft is no longer cancellable either way -- proceed with
            // navigating the session away rather than erroring out.
            console.log(
                "Complaint could not be cancelled (already finalized or cancelled):",
                draftComplaintId
            );
        }

        await clearSessionProgress(pool, context.session.id);

        if (dto.buttonReplyId === CONFIRM_ABANDON_LANGUAGE_BUTTON_ID) {
            await updateSessionState(pool, context.session.id, SESSION_STATES.WAITING_FOR_LANGUAGE, null);
            await sendLanguageSelectionReply(dto.botPhoneNumberId, dto.senderWaId);
            return;
        }

        await updateSessionState(pool, context.session.id, SESSION_STATES.READY, null);
        await sendMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
        return;
    }

    if (dto.buttonReplyId === ABANDON_KEEP_GOING_BUTTON_ID) {
        await resumeAfterAbandonDecline(handlerContext);
        return;
    }

    // Anything else -- resend the confirmation. Defaults to the MENU
    // target since the original target (menu vs. language) isn't
    // persisted anywhere except the button ID the citizen didn't tap --
    // a rare edge case (garbage input while looking at this prompt), not
    // worth adding state to preserve exactly. See design notes.
    await sendAbandonConfirmationReply(dto.botPhoneNumberId, dto.senderWaId, "MENU");
}

// Real per-step "Back" navigation, distinct from the abandon-confirmation
// path (Main Menu/Cancel/Language) -- nothing is lost by going back, so no
// confirmation is needed here.
export async function handleComplaintFlowBackCommand(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    if (!hasReplyTarget(handlerContext)) {
        console.log("Cannot handle complaint flow back command because senderWaId is missing");
        return;
    }

    const { pool, dto, context } = handlerContext;

    switch (context.session.active_step) {
        // Media step -> location step. Resend the native Send Location
        // prompt (not just the reminder) since this is a fresh entry into
        // the step, same as the first time -- upsertComplaintLocation
        // means resubmitting overwrites cleanly if they already shared one.
        case COMPLAINT_FLOW_STEPS.AWAITING_MEDIA_SUBMISSION: {
            if (!context.session.draft_complaint_id) {
                console.log("Missing draft_complaint_id in media step back command");
                await sendDraftErrorReply(handlerContext);
                return;
            }

            await updateSessionProgress(
                pool,
                context.session.id,
                COMPLAINT_FLOW_STEPS.AWAITING_LOCATION_SUBMISSION,
                context.session.draft_complaint_id
            );

            await sendComplaintDetailsSavedReply(dto.botPhoneNumberId, dto.senderWaId);
            return;
        }

        // Location step -> flow submission step. Resend the Flow on the
        // same draft_complaint_id -- saveComplaintDetailsFromFlow is an
        // UPDATE, so re-submitting overwrites the previously saved fields
        // on the same complaint row rather than creating a duplicate.
        case COMPLAINT_FLOW_STEPS.AWAITING_LOCATION_SUBMISSION: {
            if (!context.session.draft_complaint_id) {
                console.log("Missing draft_complaint_id in location step back command");
                await sendDraftErrorReply(handlerContext);
                return;
            }

            await updateSessionProgress(
                pool,
                context.session.id,
                COMPLAINT_FLOW_STEPS.AWAITING_FLOW_SUBMISSION,
                context.session.draft_complaint_id
            );

            await sendComplaintFlowReply(
                dto.botPhoneNumberId,
                dto.senderWaId,
                context.session.draft_complaint_id,
                "Let's update your complaint details. Please fill the form again."
            );
            return;
        }

        // Back while looking at the abandon-confirmation prompt reads
        // naturally as "keep going" -- same behavior as tapping the Keep
        // Going button, not a further step backward.
        case COMPLAINT_FLOW_STEPS.AWAITING_ABANDON_CONFIRMATION: {
            await resumeAfterAbandonDecline(handlerContext);
            return;
        }

        // AWAITING_FLOW_SUBMISSION: nothing precedes the Flow itself, so
        // there's no real "back" target -- treated as an abandon attempt
        // (which itself now goes through confirmation, see
        // navigationHandler.ts).
        default:
            await handleMainMenuCommand(handlerContext);
            return;
    }
}