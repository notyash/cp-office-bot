export const LANGUAGES = {
    ENGLISH: "EN",
    MARATHI: "MR",
    HINDI: "HI",
} as const

export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];