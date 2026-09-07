import { expect, test } from "@playwright/test";
import {
  capableDevice,
  type Condition,
  HOME_INDEX,
  HOME_LATEST_LIMIT,
  HYDRATED,
  motionOff,
  weatherReading,
} from "./support.ts";

/**
 * Home carries the masthead, the profile and the latest index. The index length follows the
 * registry — a production build publishes fewer entries than development, which keeps the
 * samples — so the invariant is the cap, not one number.
 */
async function complete(page: import("@playwright/test").Page) {
  await expect(page.locator("#home-title")).toBeVisible();
  await expect(page.locator("#about")).toBeVisible();
  const listed = page.locator(HOME_INDEX);
  await expect(listed.first()).toBeVisible();
  expect(await listed.count()).toBeLessThanOrEqual(HOME_LATEST_LIMIT);
}

// Each project brings its own viewport, so one pass per project covers phone and desktop widths
// without a matrix; themes change no geometry here and are audited in accessibility.spec.ts.
test("Home is complete and never scrolls sideways", {
  tag: ["@desktop", "@mobile", "@nojs"],
}, async ({ page }) => {
  await page.addInitScript(motionOff);
  await page.goto("/");
  // The masthead can only be measured once its real face has loaded.
  await page.evaluate(() => document.fonts.ready);
  await complete(page);
  // Home carries no header bar; the masthead is the identity.
  await expect(page.getByRole("banner")).toHaveCount(0);
  // The masthead deliberately overflows its column, but the document never scrolls sideways.
  const masthead = await page.locator("#home-title").evaluate((element) =>
    element.getBoundingClientRect().width
  );
  expect(masthead).toBeGreaterThan(page.viewportSize()?.width ?? 0);
  // Motion off is a promise about the renderer, not only about the animation.
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("the opening runs on every document load, clears itself and skips reduced motion", {
  tag: ["@desktop"],
}, async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lunacea-motion", "full");
    sessionStorage.clear();
  });
  await page.goto("/");
  // The inline script declares the opening before the first paint, so it is already active here
  // rather than starting once hydration lands. It never gates the document.
  await expect(page.locator("html")).toHaveAttribute("data-home-opening", "active");
  await complete(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u, HYDRATED);
  await expect(page.locator(".home-opening")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-home-opening", "active");
  await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u, HYDRATED);
  await context.close();

  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto("/");
  await expect(reducedPage.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u);
  await reduced.close();
});

test("OS restrictions, forced colours and a failing WebGL keep Home static and complete", {
  tag: ["@desktop"],
}, async ({ page }) => {
  // A stored Full preference is capped by the OS setting rather than overriding it.
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-preference", "full");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("canvas")).toHaveCount(0);

  // Motion is allowed here; the renderer is what fails, and Home survives it whole.
  await page.emulateMedia({ forcedColors: "none" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.includes("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/");
  await complete(page);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("the ambient light renders on a capable desktop and is disposed when motion turns off", {
  tag: ["@desktop"],
}, async ({ page }) => {
  await page.addInitScript(capableDevice);
  await page.goto("/");
  const light = page.locator("[data-editorial-light]");
  await expect(light).toHaveAttribute("data-webgl", "true", HYDRATED);
  await expect(light.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");
  await page.mouse.move(600, 250);
  await page.locator(".settings-trigger").click();
  // The static light and every word survive the renderer going away.
  await expect(light.locator("canvas")).toHaveCount(0);
  await expect(light).toBeAttached();
  await complete(page);
});

test("the mobile light keeps its drawing buffer through scroll and recovers from context loss", {
  tag: ["@mobile"],
}, async ({ page }) => {
  const gpuErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /WebGL|THREE|shader/i.test(message.text())) {
      gpuErrors.push(message.text());
    }
  });
  await page.addInitScript(capableDevice);
  await page.goto("/");
  const light = page.locator("[data-editorial-light]");
  await expect(light).toHaveAttribute("data-webgl", "true", HYDRATED);
  const canvas = light.locator("canvas");
  const bufferWidth = () => canvas.evaluate((node: HTMLCanvasElement) => node.width);
  await expect.poll(bufferWidth).toBeGreaterThan(300);
  // A phone address bar resizes the visual viewport on every scroll; reallocating the buffer for
  // that would drop the drawing on each flick.
  const scrolled = await canvas.evaluate(async (canvas: HTMLCanvasElement) => {
    let reallocations = 0;
    const observer = new MutationObserver((entries) => reallocations += entries.length);
    observer.observe(canvas, { attributes: true, attributeFilter: ["width", "height"] });
    for (let step = 0; step < 12; step++) {
      globalThis.scrollBy(0, step < 6 ? 120 : -120);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }
    observer.disconnect();
    return { reallocations, connected: canvas.isConnected, css: canvas.clientWidth };
  });
  expect(scrolled.reallocations).toBe(0);
  expect(scrolled.connected).toBe(true);
  expect(await bufferWidth()).toBeLessThanOrEqual(scrolled.css);
  await expect(light.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");
  // A real viewport change must still resize and redraw, unlike a scroll-only update.
  await page.setViewportSize({ width: 480, height: 760 });
  await expect.poll(bufferWidth).toBe(480);
  expect(gpuErrors).toEqual([]);
  // Losing the context falls back to the static light rather than to an empty masthead.
  await canvas.evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(canvas).toHaveCount(0);
  await expect(light).toBeAttached();
  await expect(page.locator("#home-title")).toBeVisible();
});

test("the light follows each weather reading and adds no animated layer", {
  tag: ["@desktop"],
}, async ({ page }) => {
  const conditions: Condition[] = ["clear", "cloudy", "rain", "snow", "neutral"];
  let current: Condition = "clear";
  await page.addInitScript(motionOff);
  // Query overrides only exist in dev; intercept the API for preview and deployed builds.
  await page.route(
    "**/api/v1/weather?**",
    (route) => route.fulfill({ json: weatherReading(current) }),
  );
  for (const condition of conditions) {
    current = condition;
    await page.goto("/");
    await expect(page.locator("[data-editorial-light]")).toHaveAttribute("data-weather", condition);
    await expect(page.locator("canvas, .rainfall, .snowfall, .weather-backdrop")).toHaveCount(0);
    await expect(page.locator("#home-title")).toBeVisible();
  }
  // A failed reading leaves the neutral light and a Home that still reads.
  await page.unroute("**/api/v1/weather?**");
  await page.route("**/api/v1/weather?**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("[data-editorial-light]")).toHaveAttribute("data-weather", "neutral");
  await complete(page);
});
