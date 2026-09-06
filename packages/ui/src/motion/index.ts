export { default as RevealManager } from "./RevealManager.svelte";
export { default as HomeOpening } from "./HomeOpening.svelte";
export { default as CursorLayer } from "./CursorLayer.svelte";
export { type CursorState, cursorStates } from "./cursor.ts";
export {
  canUsePageTransition,
  installAnchorNavigation,
  installPageTransitions,
} from "./page-transitions.ts";
export {
  applyMotionPreference,
  applyThemePreference,
  type EffectiveMotion,
  type EffectiveTheme,
  type MotionPreference,
  readMotionPreference,
  readThemePreference,
  resolveEffectiveMotion,
  resolveEffectiveTheme,
  setMotionPreference,
  setThemePreference,
  subscribeMotionCapabilities,
  subscribeThemeCapability,
  type ThemePreference,
} from "./preferences.ts";
