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

// Body text for the standalone nav-options bubble sent alongside (not
// merged into) each complaint-flow step message -- keeps Skip/Done paired
// with their own context while still surfacing an escape hatch on every step.
export function getNavigationOptionsMessage(): string {
  return "Need to go back a step, or exit to the main menu?";
}