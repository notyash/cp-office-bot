import { ListSection } from "../whatsapp/whatsappClient.js";
import { ID_PROOF_TYPES, POLICE_STATION_SELECTION_METHODS } from "../constants/complaints.js";

export function getComplaintDescriptionPrompt(): string {
  return "Please describe your complaint.";
}

export function getFullNamePrompt(): string {
  return "Please enter your full name.";
}

export function getPhonePrompt(): string {
  return "Please enter your phone number.";
}

export function getPoliceStationMethodMessage(): string {
  return "How would you like to select the police station for this complaint?";
}

export function getPoliceStationMethodSections(): ListSection[] {
  return [
    {
      title: "Police Station",
      rows: [
        {
          id: POLICE_STATION_SELECTION_METHODS.CHOOSE_FROM_LIST,
          title: "Choose from list",
          description: "Select from available police stations",
        },
        {
          id: POLICE_STATION_SELECTION_METHODS.USE_NEAREST,
          title: "Use nearest station",
          description: "Share location to find nearby station",
        },
        {
          id: POLICE_STATION_SELECTION_METHODS.TYPE_NAME,
          title: "Type station name",
          description: "Search by police station name",
        },
        {
          id: POLICE_STATION_SELECTION_METHODS.NOT_SURE,
          title: "I don't know",
          description: "Continue without selecting now",
        },
      ],
    },
  ];
}

export function getIdProofTypeMessage(): string {
  return "Please select your ID proof type.";
}

export function getIdProofTypeSections(): ListSection[] {
  return [
    {
      title: "ID Proof",
      rows: [
        {
          id: ID_PROOF_TYPES.AADHAAR,
          title: "Aadhaar",
        },
        {
          id: ID_PROOF_TYPES.PAN,
          title: "PAN",
        },
        {
          id: ID_PROOF_TYPES.VOTER_ID,
          title: "Voter ID",
        },
        {
          id: ID_PROOF_TYPES.DRIVING_LICENSE,
          title: "Driving License",
        },
        {
          id: ID_PROOF_TYPES.OTHER,
          title: "Other",
        },
      ],
    },
  ];
}