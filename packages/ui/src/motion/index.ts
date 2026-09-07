export { default as RevealManager } from "./RevealManager.svelte";
export { default as HomeOpening } from "./HomeOpening.svelte";
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
