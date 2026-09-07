import { expect, type Page } from "@playwright/test";
import type { WeatherState } from "../packages/schemas/mod.ts";

/** The published article that carries every editorial block: code, a diagram, an annotation and
 * a link card. Sample entries are development fixtures and are absent from a production build,
 * so nothing here may depend on them. */
export const ARTICLE = "/articles/button-feel";
/** Maths lives in the colour article, the only published entry that needs a formula. */
export const MATH_ARTICLE = "/articles/color-tokens-first";
/** Praise and impressions are per-article; any published one exercises them. */
export const REACTION_ARTICLE = "/articles/motion-that-asks-first";
/** A term that matches published content in both development and production registries. */
export const SEARCH_TERM = "ボタン";
/** Home lists the latest articles and never more than this many. */
export const HOME_LATEST_LIMIT = 6;
export const HOME_INDEX = 'ol[aria-label="最新の記事"] > li';
export const CATALOG = { name: "記事一覧" } as const;

/** Hydration waits on a cold dev server's on-demand transform, not on the assertion itself. */
export const HYDRATED = { timeout: 30_000 } as const;

/** Preferences are read by the pre-paint script, so setting them here needs no hydration wait. */
export const motionOff = () => localStorage.setItem("lunacea-motion", "off");

/** Cores and memory enough for the ambient renderer to accept the device, with motion allowed. */
export const capableDevice = () => {
  Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
  Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  localStorage.setItem("lunacea-motion", "full");
};

/** How far the document scrolls sideways beyond the window, in CSS pixels. */
export const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The overlapping area of the hairline bar and a route's first content, in square pixels. */
export const headerOverlap = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const bar = document.querySelector("header")?.getBoundingClientRect();
    const content = document.querySelector(selector)?.getBoundingClientRect();
    if (!bar || !content) return 0;
    return Math.max(0, Math.min(bar.right, content.right) - Math.max(bar.left, content.left)) *
      Math.max(0, Math.min(bar.bottom, content.bottom) - Math.max(bar.top, content.top));
  }, selector);

export type Condition = "clear" | "cloudy" | "rain" | "snow" | "neutral";

/** A reading the live API never produces, so the light has one fixed input per condition. */
export const weatherReading = (condition: Condition): WeatherState => ({
  location: {
    id: "test",
    name: "Test location",
    country: "JP",
    latitude: 35,
    longitude: 139,
    timezone: "Asia/Tokyo",
  },
  observedAt: "2026-01-01T12:00:00Z",
  temperatureC: null,
  condition: condition === "neutral" ? "unknown" : condition,
  phase: "day",
  source: condition === "neutral" ? "time-fallback" : "open-meteo",
});

/** The theme control answers only once Svelte has hydrated it, so every use waits for that. */
export async function themeToggle(page: Page) {
  const control = page.locator(".header-theme").getByRole("button");
  await expect(control).toHaveAttribute("data-ready", "true", HYDRATED);
  return control;
}
