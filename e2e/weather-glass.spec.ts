import { expect, test } from "@playwright/test";

for (const condition of ["clear", "cloudy", "rain", "snow", "neutral"]) {
  test(
    `Home ${condition} uses only static light and shadow with motion off`,
    async ({ page }, info) => {
      test.skip(info.project.name === "no-javascript");
      await page.addInitScript(() => localStorage.setItem("lunacea-motion", "off"));
      await page.goto(`/?weather=${condition}`);
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
