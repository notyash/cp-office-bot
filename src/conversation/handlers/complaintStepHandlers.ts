import {
  COMPLAINT_FLOW_STEPS,
  POLICE_STATION_SELECTION_METHODS,
} from "../../constants/complaints.js";

import {
  updateComplaintFullName,
  updateComplaintPhone,
  updateComplaintPoliceStation,
} from "../../db/repositories/complaintRepository.js";

import {
  getActivePoliceStations,
  getPoliceStationById,
} from "../../db/repositories/policeStationRepository.js";

import { updateSessionProgress } from "../../db/repositories/sessionRepository.js";

import {
  getFullNamePrompt,
  getPhonePrompt,
} from "../../messages/complaintMessages.js";

import {
  normalizePhoneNumber,
  normalizeRequiredText,
  parsePoliceStationReplyId,
} from "../../services/complaintInputService.js";

import {
  sendIdProofTypeReply,
  sendPoliceStationListReply,
  sendPromptWithNavigation,
} from "../replyService.js";

import { ConversationHandlerContext } from "./handlerContext.js";

function hasReplyTarget(
    handlerContext: ConversationHandlerContext
    // a TS guard saying "If this function returns true, then TypeScript can treat handlerContext as a ConversationHandlerContext where
    // dto.senderWaId is definitely a string."
): handlerContext is ConversationHandlerContext & {
    dto: ConversationHandlerContext["dto"] & { // keep the origina dto 
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

export async function handlePoliceStationSelectionMethod(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  if (!hasReplyTarget(handlerContext)) {
    console.log("Cannot handle police station method because senderWaId is missing");
    return;
  }

  const { pool, dto, context, input } = handlerContext;

  if (!context.session.draft_complaint_id) {
    console.log("Missing draft_complaint_id in complaint flow session");
    await sendDraftErrorReply(handlerContext);
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

export async function handlePoliceStationSelection(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  if (!hasReplyTarget(handlerContext)) {
    console.log("Cannot handle police station selection because senderWaId is missing");
    return;
  }

  const { pool, dto, context, input } = handlerContext;

  if (!context.session.draft_complaint_id) {
    console.log("Missing draft_complaint_id in police station selection step");
    await sendDraftErrorReply(handlerContext);
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

export async function handleFullNameCollection(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  if (!hasReplyTarget(handlerContext)) {
    console.log("Cannot collect full name because senderWaId is missing");
    return;
  }

  const { pool, dto, context, input } = handlerContext;

  if (!context.session.draft_complaint_id) {
    console.log("Missing draft_complaint_id in full name step");
    await sendDraftErrorReply(handlerContext);
    return;
  }

  const fullName = normalizeRequiredText(input, 3);

  if (!fullName) {
    await sendPromptWithNavigation(
      dto.botPhoneNumberId,
      dto.senderWaId,
      "Please enter a valid full name.",
      "File Complaint"
    );

    return;
  }

  await updateComplaintFullName(
    pool,
    context.session.draft_complaint_id,
    fullName
  );

  await updateSessionProgress(
    pool,
    context.session.id,
    COMPLAINT_FLOW_STEPS.COLLECT_PHONE,
    context.session.draft_complaint_id
  );

  await sendPromptWithNavigation(
    dto.botPhoneNumberId,
    dto.senderWaId,
    getPhonePrompt(),
    "File Complaint"
  );
}

export async function handlePhoneCollection(
  handlerContext: ConversationHandlerContext
): Promise<void> {
  if (!hasReplyTarget(handlerContext)) {
    console.log("Cannot collect phone because senderWaId is missing");
    return;
  }

  const { pool, dto, context, input } = handlerContext;

  if (!context.session.draft_complaint_id) {
    console.log("Missing draft_complaint_id in phone step");
    await sendDraftErrorReply(handlerContext);
    return;
  }

  const phone = normalizePhoneNumber(input);

  if (!phone) {
    await sendPromptWithNavigation(
      dto.botPhoneNumberId,
      dto.senderWaId,
      "Please enter a valid phone number.",
      "File Complaint"
    );

    return;
  }

  await updateComplaintPhone(pool, context.session.draft_complaint_id, phone);

  await updateSessionProgress(
    pool,
    context.session.id,
    COMPLAINT_FLOW_STEPS.COLLECT_ID_PROOF_TYPE,
    context.session.draft_complaint_id
  );

  await sendIdProofTypeReply(dto.botPhoneNumberId, dto.senderWaId);
}