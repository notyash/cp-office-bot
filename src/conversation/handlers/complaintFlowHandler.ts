import {
  COMPLAINT_FLOW_STEPS,
  POLICE_STATION_SELECTION_METHODS,
} from "../../constants/complaints.js";

import { getActivePoliceStations } from "../../db/repositories/policeStationRepository.js";
import { updateSessionProgress } from "../../db/repositories/sessionRepository.js";
import { updateComplaintPoliceStation } from "../../db/repositories/complaintRepository.js";
import { getPoliceStationById } from "../../db/repositories/policeStationRepository.js";
import { getFullNamePrompt } from "../../messages/complaintMessages.js";

import {
  sendPoliceStationListReply,
  sendPromptWithNavigation,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";

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

async function handlePoliceStationSelectionMethod(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context, input } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot handle police station method because senderWaId is missing");
    return;
  }

  if (!context.session.draft_complaint_id) {
    console.log("Missing draft_complaint_id in complaint flow session");
    await sendPromptWithNavigation(
      dto.botPhoneNumberId,
      dto.senderWaId,
      "Something went wrong with your complaint draft. Please go back to main menu and try again.",
      "File Complaint"
    );
    return;
  }

  switch (input) {
    case POLICE_STATION_SELECTION_METHODS.CHOOSE_FROM_LIST: {
      const policeStations = await getActivePoliceStations(pool);

      await updateSessionProgress(
        pool,
        context.session.id,
        COMPLAINT_FLOW_STEPS.SELECT_POLICE_STATION,
        context.session.draft_complaint_id
      );

      await sendPoliceStationListReply(
        dto.botPhoneNumberId,
        dto.senderWaId,
        policeStations
      );

      return;
    }

    case POLICE_STATION_SELECTION_METHODS.USE_NEAREST:
      await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Location-based police station selection will be added next. For now, please choose from the list.",
        "File Complaint"
      );
      return;

    case POLICE_STATION_SELECTION_METHODS.TYPE_NAME:
      await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Police station search by name will be added later. For now, please choose from the list.",
        "File Complaint"
      );
      return;

    case POLICE_STATION_SELECTION_METHODS.NOT_SURE:
      await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "No problem. We will continue without selecting a police station for now.",
        "File Complaint"
      );
      return;

    default:
      await sendPromptWithNavigation(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Please choose one option for selecting the police station.",
        "File Complaint"
      );
      return;
  }
}

function parsePoliceStationReplyId(input: string | undefined): number | null {
  if (!input) {
    return null;
  }

  const match = input.match(/^POLICE_STATION_(\d+)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

async function handlePoliceStationSelection(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  const { pool, dto, context, input } = handlerContext;

  if (!dto.senderWaId) {
    console.log("Cannot handle police station selection because senderWaId is missing");
    return;
  }

  if (!context.session.draft_complaint_id) {
    console.log("Missing draft_complaint_id in police station selection step");

    await sendPromptWithNavigation(
      dto.botPhoneNumberId,
      dto.senderWaId,
      "Something went wrong with your complaint draft. Please go back to main menu and try again.",
      "File Complaint"
    );

    return;
  }

  const policeStationId = parsePoliceStationReplyId(input);

  if (!policeStationId) {
    await sendPromptWithNavigation(
      dto.botPhoneNumberId,
      dto.senderWaId,
      "Please select a police station from the list.",
      "File Complaint"
    );

    return;
  }

  const policeStation = await getPoliceStationById(pool, policeStationId);

  if (!policeStation) {
    await sendPromptWithNavigation(
      dto.botPhoneNumberId,
      dto.senderWaId,
      "That police station is not available. Please go back and choose again.",
      "File Complaint"
    );

    return;
  }

  await updateComplaintPoliceStation(
    pool,
    context.session.draft_complaint_id,
    policeStation.id
  );

  await updateSessionProgress(
    pool,
    context.session.id,
    COMPLAINT_FLOW_STEPS.COLLECT_FULL_NAME,
    context.session.draft_complaint_id
  );

  await sendPromptWithNavigation(
    dto.botPhoneNumberId,
    dto.senderWaId,
    getFullNamePrompt(),
    "File Complaint"
  );
}