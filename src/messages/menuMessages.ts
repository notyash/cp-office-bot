import { ListSection } from "../whatsapp/whatsappClient.js";

export function getMainMenuMessage(): string {
  return "👋 How can we help you today?";
}

export function getMainMenuSections(): ListSection[] {
  return [
    {
      title: "Services",
      rows: [
        {
            id: "FILE_COMPLAINT",
            title: "File a complaint",
            description: "Register a new police complaint",
        },
        {
            id: "CHECK_COMPLAINT_STATUS",
            title: "Check status",
            description: "Track your filed complaints",
        },
        {
            id: "FIND_POLICE_STATION",
            title: "Find police station",
            description: "Find nearby police station details",
        },
        {
            id: "FIND_PARKING",
            title: "Find parking",
            description: "Parking help and information",
        },
        {
            id: "GENERAL_QNA",
            title: "Help / Question",
            description: "Ask a general question",
        },
        {
            id: "CHANGE_LANGUAGE",
            title: "Change language",
            description: "Switch English / मराठी / हिंदी",
        }
      ],
    },
  ];
}

export function getInvalidMainMenuMessage(): string {
  return "That's not a valid option — please choose from the menu below.";
}