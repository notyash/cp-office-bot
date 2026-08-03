import { ReplyButton } from "../whatsapp/whatsappClient.js";

export function getLanguageSelectionMessage(): string {
  return "🌐 Please choose your language:";
}

export function getLanguageSelectionButtons(): ReplyButton[] {
  return [
    { id: "LANG_EN", title: "English" },
    { id: "LANG_MR", title: "मराठी" },
    { id: "LANG_HI", title: "हिंदी" },
  ];
}

export function getLanguageSavedMessage(): string {
  return "✅ Language saved.";
}