export const NAVIGATION_ACTIONS = {
  GO_BACK: "GO_BACK",
  GO_TO_MAIN_MENU: "GO_TO_MAIN_MENU",
} as const;

export type NavigationAction =
  (typeof NAVIGATION_ACTIONS)[keyof typeof NAVIGATION_ACTIONS];