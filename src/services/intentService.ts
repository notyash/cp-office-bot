import { INTENTS, Intent } from "../constants/intents.js";
import { SESSION_STATES, SessionState } from "../constants/sessionStates.js";

export function parseMainMenuIntent(text: string | undefined): Intent {
  const normalized = text?.trim().toLowerCase();

  if (!normalized) {
    return INTENTS.UNKNOWN;
  }

  if (
    normalized === "1" ||
    normalized === "file complaint" ||
    normalized === "complaint"
  ) {
    return INTENTS.FILE_COMPLAINT;
  }

  if (
    normalized === "2" ||
    normalized === "check complaint status" ||
    normalized === "status"
  ) {
    return INTENTS.CHECK_COMPLAINT_STATUS;
  }

  if (
    normalized === "3" ||
    normalized === "find police station" ||
    normalized === "police station"
  ) {
    return INTENTS.FIND_POLICE_STATION;
  }

  if (
    normalized === "4" ||
    normalized === "find parking" ||
    normalized === "parking"
  ) {
    return INTENTS.FIND_PARKING;
  }

  return INTENTS.UNKNOWN;
}

export function getNextStateForIntent(intent: Intent): SessionState {
  switch (intent) {
    case INTENTS.FILE_COMPLAINT:
      return SESSION_STATES.IN_COMPLAINT_FLOW;

    case INTENTS.CHECK_COMPLAINT_STATUS:
      return SESSION_STATES.CHECKING_COMPLAINT_STATUS;

    case INTENTS.FIND_POLICE_STATION:
    case INTENTS.FIND_PARKING:
    case INTENTS.GENERAL_QNA:
    case INTENTS.UNKNOWN:
      return SESSION_STATES.READY;
  }
}