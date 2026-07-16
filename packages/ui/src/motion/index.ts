export { default as RevealManager } from "./RevealManager.svelte";
export { default as CursorLayer } from "./CursorLayer.svelte";
export { type CursorState, cursorStates } from "./cursor.ts";
export {
  canUsePageTransition,
  installAnchorNavigation,
  installPageTransitions,
} from "./page-transitions.ts";
export {
  applyDisplayPreferences,
  type EffectiveMotion,
  type MotionPreference,
  readMotionPreference,
  readThemePreference,
  resolveEffectiveMotion,
  setMotionPreference,
  setThemePreference,
  subscribeDisplayCapabilities,
  type ThemePreference,
} from "./preferences.ts";
