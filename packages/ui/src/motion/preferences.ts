export type ThemePreference = "auto" | "light" | "dark";
export type MotionPreference = "full" | "reduced" | "off";
export type EffectiveMotion = MotionPreference;
export type EffectiveTheme = "light" | "dark";

type Connection = EventTarget & { saveData?: boolean };

const themeKey = "lunacea-theme";
const motionKey = "lunacea-motion";

function storedValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = localStorage.getItem(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readThemePreference(): ThemePreference {
  return storedValue(themeKey, ["auto", "light", "dark"] as const, "auto");
}

export function readMotionPreference(): MotionPreference {
  return storedValue(motionKey, ["full", "reduced", "off"] as const, "full");
}

export function resolveEffectiveMotion(preference: MotionPreference): EffectiveMotion {
  if (preference === "off") return "off";
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  const capabilityLimit = matchMedia("(prefers-reduced-motion: reduce)").matches ||
    matchMedia("(forced-colors: active)").matches || connection?.saveData;
  return preference === "reduced" || capabilityLimit ? "reduced" : "full";
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  return preference === "auto"
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
}

export function applyThemePreference(themePreference = readThemePreference()) {
  const theme = resolveEffectiveTheme(themePreference);
  const root = document.documentElement;
  root.dataset.themePreference = themePreference;
  root.dataset.theme = theme;
  return { themePreference, theme };
}

export function applyMotionPreference(motionPreference = readMotionPreference()) {
  const motion = resolveEffectiveMotion(motionPreference);
  const root = document.documentElement;
  root.dataset.motionPreference = motionPreference;
  root.dataset.motion = motion;
  return { motionPreference, motion };
}

export function setThemePreference(preference: ThemePreference) {
  localStorage.setItem(themeKey, preference);
  const state = applyThemePreference(preference);
  globalThis.dispatchEvent(new CustomEvent("lunacea:theme", { detail: state }));
  return state;
}

export function setMotionPreference(preference: MotionPreference) {
  localStorage.setItem(motionKey, preference);
  const state = { ...applyThemePreference(), ...applyMotionPreference(preference) };
  globalThis.dispatchEvent(new CustomEvent("lunacea:motion", { detail: state }));
  return state;
}

export function subscribeThemeCapability(callback: () => void) {
  const query = matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function subscribeMotionCapabilities(callback: () => void) {
  const media = [
    matchMedia("(prefers-reduced-motion: reduce)"),
    matchMedia("(forced-colors: active)"),
  ];
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  for (const query of media) query.addEventListener("change", callback);
  connection?.addEventListener("change", callback);

  return () => {
    for (const query of media) query.removeEventListener("change", callback);
    connection?.removeEventListener("change", callback);
  };
}
