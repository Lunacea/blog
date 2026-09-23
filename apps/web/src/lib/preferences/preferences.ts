export type ThemePreference = "auto" | "light" | "dark";
export type MotionPreference = "full" | "off";
export type EffectiveMotion = MotionPreference;
export type EffectiveTheme = "light" | "dark";
export type MotionState = {
  motionPreference: MotionPreference;
  motion: EffectiveMotion;
};

type Connection = EventTarget & { saveData?: boolean };

const themeKey = "lunacea-theme";
const motionKey = "lunacea-motion";

function storedValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  let value: string | null = null;
  try {
    value = localStorage.getItem(key);
  } catch { /* ストレージは任意。 */ }
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readThemePreference(): ThemePreference {
  return storedValue(themeKey, ["auto", "light", "dark"] as const, "auto");
}

export function readMotionPreference(): MotionPreference {
  const stored = storedValue(motionKey, ["full", "reduced", "off"] as const, "full");
  return stored === "full" ? "full" : "off";
}

export function resolveEffectiveMotion(preference: MotionPreference): EffectiveMotion {
  if (preference === "off") return "off";
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  const capabilityLimit = matchMedia("(prefers-reduced-motion: reduce)").matches ||
    matchMedia("(forced-colors: active)").matches || connection?.saveData;
  return capabilityLimit ? "off" : "full";
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
  try {
    localStorage.setItem(themeKey, preference);
  } catch { /* メモリ上の状態だけで動かす。 */ }
  const state = applyThemePreference(preference);
  globalThis.dispatchEvent(new CustomEvent("lunacea:theme", { detail: state }));
  return state;
}

export function setMotionPreference(preference: MotionPreference) {
  try {
    localStorage.setItem(motionKey, preference);
  } catch { /* メモリ上の状態だけで動かす。 */ }
  const state = applyMotionPreference(preference);
  globalThis.dispatchEvent(new CustomEvent("lunacea:motion", { detail: state }));
  return state;
}

export function subscribeMotionPreference(callback: (state: MotionState) => void) {
  const refresh = () => callback(applyMotionPreference(readMotionPreference()));
  const changed = (event: Event) => {
    const state = (event as CustomEvent<MotionState>).detail;
    callback(state ?? applyMotionPreference(readMotionPreference()));
  };
  const stored = (event: StorageEvent) => {
    if (event.key === motionKey || event.key === null) refresh();
  };

  refresh();
  const stopCapabilities = subscribeMotionCapabilities(refresh);
  globalThis.addEventListener("lunacea:motion", changed);
  globalThis.addEventListener("storage", stored);

  return () => {
    stopCapabilities();
    globalThis.removeEventListener("lunacea:motion", changed);
    globalThis.removeEventListener("storage", stored);
  };
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
