import { expect, test } from "@playwright/test";

async function mockWeather(page: import("@playwright/test").Page, condition: "rain" | "snow") {
  await page.route("**/api/v1/weather?*", (route) =>
    route.fulfill({
      json: {
        location: {
          id: "morioka-jp",
          name: "盛岡",
          region: "岩手県",
          country: "日本",
          latitude: 39.7036,
          longitude: 141.1527,
          timezone: "Asia/Tokyo",
        },
        observedAt: "2026-09-05T12:00",
        temperatureC: 3,
        condition,
        phase: "day",
        source: "open-meteo",
      },
    }));
}

test(
  "rain keeps its canvas when the central WebGL scene loads",
  async ({ page }, info) => {
    test.skip(info.project.name === "no-javascript");
    await page.setViewportSize({ width: 640, height: 480 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 4 });
      localStorage.setItem("lunacea-motion", "full");
    });
    let release!: () => void;
    const ready = new Promise<void>((resolve) => release = resolve);
    await page.route("**/*HeroScene*", async (route) => {
      await ready;
      await route.continue();
    });
    await mockWeather(page, "rain");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const glass = page.locator("[data-precipitation=rain]");
    await expect(glass).toBeVisible();
    await glass.evaluate((element) => element.setAttribute("data-original-surface", "true"));
    release();
    await expect(page.locator(".ambient")).toHaveAttribute("data-webgl", "true", {
      timeout: 20000,
    });
    await expect(glass).toHaveAttribute("data-original-surface", "true");
    await expect(page.locator(".weather-atmosphere")).toHaveCount(1);
  },
);

for (const condition of ["rain", "snow"] as const) {
  test(
    `${condition} preserves its viewport and reduced-motion navigation`,
    async ({ page }, info) => {
      test.skip(info.project.name === "no-javascript");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 390, height: 844 });
      await mockWeather(page, condition);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const surface = page.locator(".weather-atmosphere");
      await expect(
        page.locator(
          condition === "rain" ? "[data-precipitation=rain]" : "[data-precipitation=snow]",
        ),
      ).toBeVisible();
      const before = await surface.boundingBox();
      await page.evaluate(() => scrollTo(0, innerHeight));
      expect(await surface.boundingBox()).toEqual(before);
      expect(await surface.evaluate((element) => element.getAnimations({ subtree: true }).length))
        .toBe(0);
      await expect(page.locator(".ambient canvas")).toHaveCount(0);
      await expect(surface).toHaveCSS("pointer-events", "none");
      await page.emulateMedia({ forcedColors: "active" });
      await expect(surface).toBeHidden();
    },
  );
}

test("snow falls at independent phases without attached clumps", async ({ page }, info) => {
  test.skip(info.project.name === "no-javascript");
  await page.setViewportSize({ width: 640, height: 480 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await mockWeather(page, "snow");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const snow = page.locator("[data-precipitation=snow]");
  await expect(snow).toBeVisible();
  await expect(page.locator("[data-glass=snow]")).toHaveCount(0);
  const motion = await snow.evaluate((element) => {
    const falling = element.getAnimations({ subtree: true }).filter((animation) =>
      animation instanceof CSSAnimation && animation.animationName === "weather-snowfall"
    );
    return falling.map((animation) => ({
      delay: animation.effect?.getTiming().delay,
      duration: animation.effect?.getTiming().duration,
      state: animation.playState,
    }));
  });
  expect(motion.length).toBeGreaterThan(50);
  expect(new Set(motion.map((item) => item.delay)).size).toBe(motion.length);
  expect(new Set(motion.map((item) => item.duration)).size).toBe(motion.length);
  expect(motion.every((item) => item.state === "running" && Number(item.delay) < 0)).toBe(true);
});

test("rain renders falling streaks and freezes when motion is off", async ({ page }, info) => {
  test.skip(info.project.name === "no-javascript");
  await page.setViewportSize({ width: 640, height: 480 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await mockWeather(page, "rain");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const rain = page.locator("canvas[data-precipitation=rain]");
  await expect(rain).toBeVisible();
  const snapshot = () => rain.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const initial = await snapshot();
  await expect.poll(snapshot).not.toBe(initial);
  await page.evaluate(() => {
    document.documentElement.dataset.motion = "off";
    dispatchEvent(new CustomEvent("lunacea:motion"));
  });
  const frozen = await snapshot();
  await page.waitForTimeout(200);
  expect(await snapshot()).toBe(frozen);
  await expect(page.locator("svg [data-glass=rain]")).toHaveCount(0);
});
