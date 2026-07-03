import { ReplyButton } from "../whatsapp/whatsappClient.js";
import { NAVIGATION_ACTIONS } from "../constants/navigationActions.js";

export function getNavigationButtons(): ReplyButton[] {
  return [
    {
      id: NAVIGATION_ACTIONS.GO_BACK,
      title: "Back",
    },
    {
      id: NAVIGATION_ACTIONS.GO_TO_MAIN_MENU,
      title: "Main Menu",
    },
  ];
}