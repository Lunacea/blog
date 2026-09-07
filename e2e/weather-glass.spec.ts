import { expect, test } from "@playwright/test";
import type { WeatherState } from "../packages/schemas/mod.ts";

for (const condition of ["clear", "cloudy", "rain", "snow", "neutral"] as const) {
  test(
    `Home ${condition} uses only static light and shadow with motion off`,
    async ({ page }, info) => {
      test.skip(info.project.name === "no-javascript");
      await page.addInitScript(() => localStorage.setItem("lunacea-motion", "off"));
      // Query overrides only exist in dev; intercept the API for preview and deployed builds.
      await page.route("**/api/v1/weather?**", (route) =>
        route.fulfill({
          json: {
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
          } satisfies WeatherState,
        }));
      await page.goto("/");
      const light = page.locator("[data-editorial-light]");
      await expect(light).toHaveAttribute("data-weather", condition);
      await expect(page.locator("canvas, .rainfall, .snowfall, .weather-backdrop")).toHaveCount(0);
      await expect(page.locator("#home-title")).toBeVisible();
      await expect(page.locator('ol[aria-label="最新の記事"] > li')).toHaveCount(6);
    },
  );
}

test("weather failure leaves a neutral usable Home", async ({ page }, info) => {
  test.skip(info.project.name === "no-javascript");
  await page.route("**/api/v1/weather?**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("[data-editorial-light]")).toHaveAttribute("data-weather", "neutral");
  await expect(page.locator("#about")).toBeVisible();
  await expect(page.locator('ol[aria-label="最新の記事"] > li')).toHaveCount(6);
});
