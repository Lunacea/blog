import { expect, type Page } from "@playwright/test";
import type { WeatherState } from "../packages/schemas/mod.ts";

/**
 * すべての編集ブロックを含む公開記事。sample 記事は開発用で本番ビルドには存在しないため、
 * ここでは依存しない。
 */
export const ARTICLE = "/articles/button-feel";
/** 数式を含む唯一の公開記事。 */
export const MATH_ARTICLE = "/articles/color-tokens-first";
export const REACTION_ARTICLE = "/articles/motion-that-asks-first";
/** 開発・本番どちらのレジストリでもヒットする検索語。 */
export const SEARCH_TERM = "ボタン";
/** ホームが並べる最新記事の上限。 */
export const HOME_LATEST_LIMIT = 6;
export const HOME_INDEX = 'ol[aria-label="最新の記事"] > li';
export const CATALOG = { name: "記事一覧" } as const;

/** 冷えた開発サーバのオンデマンド変換を待つための猶予。アサーション自体の待ちではない。 */
export const HYDRATED = { timeout: 30_000 } as const;

/** 設定は描画前スクリプトが読むため、ここでの設定にハイドレーション待ちは要らない。 */
export const motionOff = () => localStorage.setItem("lunacea-motion", "off");

/** 背景レンダラが端末を受け入れるだけのコア数とメモリ。 */
export const capableDevice = () => {
  Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
  Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  localStorage.setItem("lunacea-motion", "full");
};

/** 文書が窓の外へ横スクロールする量（CSS ピクセル）。 */
export const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** ヘッダとルート先頭コンテンツの重なり面積（平方ピクセル）。 */
export const headerOverlap = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const bar = document.querySelector("header")?.getBoundingClientRect();
    const content = document.querySelector(selector)?.getBoundingClientRect();
    if (!bar || !content) return 0;
    return Math.max(0, Math.min(bar.right, content.right) - Math.max(bar.left, content.left)) *
      Math.max(0, Math.min(bar.bottom, content.bottom) - Math.max(bar.top, content.top));
  }, selector);

export type Condition = "clear" | "cloudy" | "rain" | "snow" | "neutral";

/** 実 API が返さない固定値。条件ごとに入力を1つに固定する。 */
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

/** テーマ操作はハイドレーション後にしか反応しないため、毎回それを待つ。 */
export async function themeToggle(page: Page) {
  const control = page.locator(".header-theme").getByRole("button");
  await expect(control).toHaveAttribute("data-ready", "true", HYDRATED);
  return control;
}
