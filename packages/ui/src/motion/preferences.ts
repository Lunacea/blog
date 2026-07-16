export type ThemePreference = "auto" | "light" | "dark";
export type MotionPreference = "full" | "reduced" | "off";
export type EffectiveMotion = MotionPreference;

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

export function applyDisplayPreferences(
  themePreference = readThemePreference(),
  motionPreference = readMotionPreference(),
) {
  const root = document.documentElement;
  const theme = themePreference === "auto"
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : themePreference;
  const motion = resolveEffectiveMotion(motionPreference);

  root.dataset.themePreference = themePreference;
  root.dataset.theme = theme;
  root.dataset.motionPreference = motionPreference;
  root.dataset.motion = motion;
  return { themePreference, theme, motionPreference, motion };
}

export function setThemePreference(preference: ThemePreference) {
  localStorage.setItem(themeKey, preference);
  const state = applyDisplayPreferences(preference, readMotionPreference());
  globalThis.dispatchEvent(new CustomEvent("lunacea:theme", { detail: state }));
  return state;
}

export function setMotionPreference(preference: MotionPreference) {
  localStorage.setItem(motionKey, preference);
  const state = applyDisplayPreferences(readThemePreference(), preference);
  globalThis.dispatchEvent(new CustomEvent("lunacea:motion", { detail: state }));
  return state;
}

export function subscribeDisplayCapabilities(callback: () => void) {
  const media = [
    matchMedia("(prefers-color-scheme: dark)"),
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
