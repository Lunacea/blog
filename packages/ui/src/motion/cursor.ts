/**
 * Reserved states for a possible progressive custom-cursor enhancement.
 * The native cursor remains the only implementation until that enhancement is explicitly planned.
 */
export const cursorStates = [
  "default",
  "interactive",
  "text",
  "reading-text",
  "media",
  "webgl",
  "drag",
] as const;

export type CursorState = (typeof cursorStates)[number];
