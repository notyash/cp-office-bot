import { INTENTS } from "../../constants/intents.js";
import { COMPLAINT_FLOW_STEPS } from "../../constants/complaints.js";

import {
    getNextStateForIntent,
    parseMainMenuIntent,
} from "../../services/intentService.js";

import { createDraftComplaint } from "../../db/repositories/complaintRepository.js";
import { sendComplaintFlowReply } from "../replyService.js";

import {
    updateSessionIntent,
    updateSessionProgress,
    updateSessionState,
} from "../../db/repositories/sessionRepository.js";

import { getComplaintIdPrompt } from "../../messages/statusMessages.js";

import {
    getGeneralQuestionComingSoonMessage,
    getParkingComingSoonMessage,
    getPoliceStationFinderComingSoonMessage,
} from "../../messages/placeholderMessages.js";

import {
    sendInvalidMainMenuReply,
    sendPromptWithNavigation,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";

export async function handleMainMenuSelection(
    handlerContext: ConversationHandlerContext
): Promise<void> {
    const { pool, dto, context, input } = handlerContext;

    if (!dto.senderWaId) {
        console.log("Cannot handle main menu because senderWaId is missing");
        return;
    }

    const intent = parseMainMenuIntent(input);

    console.log("Selected intent:", intent);

    if (intent === INTENTS.UNKNOWN) {
        await sendInvalidMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
        return;
    }

    const nextState = getNextStateForIntent(intent);

    if (intent === INTENTS.FILE_COMPLAINT) {
        const draftComplaint = await createDraftComplaint(pool, context.user.id);

        await updateSessionIntent(pool, context.session.id, intent);
        await updateSessionState(pool, context.session.id, nextState, intent);

        await sendComplaintFlowReply(
            dto.botPhoneNumberId,
            dto.senderWaId,
            draftComplaint.id
        );

        await updateSessionProgress(
            pool,
            context.session.id,
            COMPLAINT_FLOW_STEPS.AWAITING_FLOW_SUBMISSION,
            draftComplaint.id
        );

        return;
    }

    let prompt: string;
    let header: string;

    switch (intent) {
        case INTENTS.CHECK_COMPLAINT_STATUS:
            prompt = getComplaintIdPrompt();
            header = "Complaint Status";
            break;

        case INTENTS.FIND_POLICE_STATION:
            prompt = getPoliceStationFinderComingSoonMessage();
            header = "Find Police Station";
            break;

        case INTENTS.FIND_PARKING:
            prompt = getParkingComingSoonMessage();
            header = "Find Nearest Parking";
            break;

        case INTENTS.GENERAL_QNA:
            prompt = getGeneralQuestionComingSoonMessage();
            header = "General QNA";
            break;

        default:
            await sendInvalidMainMenuReply(dto.botPhoneNumberId, dto.senderWaId);
            return;
    }

    await updateSessionIntent(pool, context.session.id, intent);
    await updateSessionState(pool, context.session.id, nextState, intent);

    await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        prompt,
        header
    );
}