import { LANGUAGES, Language } from "../constants/languages.js";

export function parseLanguageSelection(text: string | undefined): Language | null {
  const normalized = text?.trim().toLowerCase();

  if (!normalized) return null;

  if (normalized === "1" || normalized === "english" || normalized === "en") {
    return LANGUAGES.ENGLISH;
  }

  if (normalized === "2" || normalized === "marathi" || normalized === "mr" || normalized === "मराठी") {
    return LANGUAGES.MARATHI;
  }

  if (normalized === "3" || normalized === "hindi" || normalized === "hi" || normalized === "हिंदी") {
    return LANGUAGES.HINDI;
  }

  return null;
}