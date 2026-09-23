import { expect } from "@playwright/test";
import {
  capableDevice,
  type Condition,
  HOME_INDEX,
  HOME_LATEST_LIMIT,
  HYDRATED,
  motionOff,
  test,
  weatherReading,
} from "./support.ts";

/** 一覧の件数はレジストリ次第（本番はサンプルを含まないぶん少ない）ので、上限だけを不変条件とする。 */
async function complete(page: import("@playwright/test").Page) {
  await expect(page.locator("#home-title")).toBeVisible();
  await expect(page.locator("#about")).toBeVisible();
  const listed = page.locator(HOME_INDEX);
  await expect(listed.first()).toBeVisible();
  expect(await listed.count()).toBeLessThanOrEqual(HOME_LATEST_LIMIT);
}

async function supportsWebgl(
  page: import("@playwright/test").Page,
  requireContextLoss = false,
) {
  return await page.evaluate((requireContextLoss) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(
      context &&
        (!requireContextLoss || context.getExtension("WEBGL_lose_context")),
    );
  }, requireContextLoss);
}

// プロジェクトごとにビューポートが違うため、1パスで電話と PC の両幅を覆える。
test("Home is complete and never scrolls sideways", {
  tag: ["@desktop", "@mobile", "@nojs"],
}, async ({ page }) => {
  await page.addInitScript(motionOff);
  await page.goto("/");
  // 題字は実フォント読み込み後でないと測れない。
  await page.evaluate(() => document.fonts.ready);
  await complete(page);
  await expect(page.getByRole("banner")).toHaveCount(0);
  const masthead = await page.locator("#home-title").evaluate((element) =>
    element.getBoundingClientRect().width
  );
  expect(masthead).toBeGreaterThan(page.viewportSize()?.width ?? 0);
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
    // オープニングは 1.2 秒で終わるので、読み込みが遅いと load の時点ではもう印が消えている。
    // 描画前スクリプトが宣言した値を、文書の組み立て直後に控えておく。
    document.addEventListener("DOMContentLoaded", () => {
      (globalThis as typeof globalThis & { __opening?: string }).__opening =
        document.documentElement.dataset.homeOpening ?? "";
    }, { once: true });
  });
  const openedAtStart = () =>
    page.evaluate(() => (globalThis as typeof globalThis & { __opening?: string }).__opening);
  await page.goto("/");
  expect(await openedAtStart()).toBe("active");
  await complete(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u, HYDRATED);
  await expect(page.locator(".home-opening")).toHaveCount(0);
  await page.reload();
  expect(await openedAtStart()).toBe("active");
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
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // 保存された希望は ON のままでも、OS の設定が優先されて OFF で描く。
  expect(await page.evaluate(() => localStorage.getItem("lunacea-motion"))).toBe("full");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("canvas")).toHaveCount(0);

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
  tag: ["@desktop", "@webgl"],
}, async ({ page }) => {
  await page.addInitScript(capableDevice);
  test.skip(!await supportsWebgl(page), "The test browser has no WebGL context");
  await page.goto("/");
  const light = page.locator("[data-editorial-light]");
  await expect(light).toHaveAttribute("data-webgl", "true", HYDRATED);
  await expect(light.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");
  await light.evaluate((node) => {
    (globalThis as typeof globalThis & { __weatherField?: Element }).__weatherField = node;
  });
  await page.getByRole("link", { name: /All articles/i }).click();
  await expect(page).toHaveURL(/\/articles$/u);
  await expect(light).toHaveCount(1);
  expect(
    await light.evaluate((node) =>
      node === (globalThis as typeof globalThis & { __weatherField?: Element }).__weatherField
    ),
  ).toBe(true);
  await expect(light.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");
  await page.mouse.move(600, 250);
  await page.locator(".header-display").getByRole("button").click();
  await expect(light.locator("canvas")).toHaveCount(0);
  await expect(light).toBeAttached();
  await expect(page.getByRole("heading", { level: 1, name: "Articles" })).toBeVisible();
});

test("the mobile light keeps its drawing buffer through scroll and recovers from context loss", {
  tag: ["@mobile", "@webgl"],
}, async ({ page }) => {
  const gpuErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /WebGL|THREE|shader/i.test(message.text())) {
      gpuErrors.push(message.text());
    }
  });
  await page.addInitScript(capableDevice);
  test.skip(
    !await supportsWebgl(page, true),
    "The test browser has no context-loss capable WebGL context",
  );
  await page.goto("/");
  const light = page.locator("[data-editorial-light]");
  await expect(light).toHaveAttribute("data-webgl", "true", HYDRATED);
  const canvas = light.locator("canvas");
  const bufferWidth = () => canvas.evaluate((node: HTMLCanvasElement) => node.width);
  await expect.poll(bufferWidth).toBeGreaterThan(300);
  // 電話のアドレスバーはスクロールのたびに visual viewport を変える。ここで再確保すると毎回描画が消える。
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
  await page.setViewportSize({ width: 480, height: 760 });
  await expect.poll(bufferWidth).toBe(480);
  expect(gpuErrors).toEqual([]);
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
  // クエリによる上書きは開発時のみ。プレビューや本番では API を差し替える。
  await page.route(
    "**/api/v1/weather?**",
    (route) => route.fulfill({ json: weatherReading(current) }),
  );
  for (const condition of conditions) {
    current = condition;
    await page.goto("/");
    const shown = ["clear", "cloudy"].includes(condition)
      ? ["clear", "cloudy", "rain", "snow"]
      : [condition];
    await expect
      .poll(() => page.locator("[data-editorial-light]").getAttribute("data-weather"))
      .toMatch(new RegExp(`^(${shown.join("|")})$`, "u"));
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("#home-title")).toBeVisible();
  }
  await page.unroute("**/api/v1/weather?**");
  await page.route("**/api/v1/weather?**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("[data-editorial-light]")).toHaveAttribute("data-weather", "neutral");
  await complete(page);
});
