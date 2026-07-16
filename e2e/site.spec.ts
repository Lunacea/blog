import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const primaryRoutes = ["/", "/articles", "/works", "/talks", "/archive", "/about", "/search"];

test("all primary routes render on desktop and mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "no-javascript");
  for (const route of primaryRoutes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});

test("editorial HTML remains complete without JavaScript", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "no-javascript");
  await page.goto("/articles/resilient-content-pipeline");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".code-block code")).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();
  await expect(page.locator(".mermaid-source")).toBeVisible();
  await expect(page.locator(".mermaid-diagram")).toHaveCount(0);
});

test("theme and motion preferences survive navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  await expect(page.locator(".settings[data-slot='collapsible-root']")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByText("Display", { exact: true }).click();
  await page.getByLabel("Theme").selectOption("dark");
  await page.getByLabel("Motion").selectOption("off");
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
});

test("mobile navigation dismisses with Escape and returns focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  await expect(page.locator("header")).toHaveAttribute("data-ready", "true");
  const menu = page.getByRole("button", { name: /メニュー/ });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});

test("OS reduced motion caps a saved Full preference", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-preference", "full");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("forced colors disables custom scroll colors and WebGL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.emulateMedia({ forcedColors: "active" });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("narrow mobile, tablet, and 200% text do not create horizontal overflow", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop");
  for (const viewport of [{ width: 320, height: 720 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/articles");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("back and forward navigation preserve route usability", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  await page.goto("/works");
  await page.goBack();
  await expect(page).toHaveURL(/\/articles$/u);
  await expect(page.locator("main")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/works$/u);
  await expect(page.locator("main")).toBeVisible();
});

test("home is one desktop frame with a deterministic non-WebGL fallback", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "off"));
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    viewport: globalThis.innerHeight,
    document: document.documentElement.scrollHeight,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.locator(".ambient")).toHaveAttribute("data-webgl", "false");
  await expect(page.locator(".ambient .fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("article has reading tools but never creates a WebGL canvas", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/resilient-content-pipeline");
  await expect(page.getByRole("heading", { name: "壊れにくいコンテンツパイプラインを設計する" }))
    .toBeVisible();
  await expect(page.getByRole("progressbar", { name: "読了進捗" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "目次" })).toBeVisible();
  const diagram = page.locator(".mermaid-diagram svg");
  await expect(diagram).toBeVisible();
  const diagramBox = await diagram.boundingBox();
  expect(diagramBox?.height).toBeLessThan(diagramBox?.width ?? 0);
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copy = page.getByRole("button", { name: "コードをコピー" }).first();
  await copy.click();
  await expect(copy).toHaveText("Copied");
});

test("anonymous reaction toggles with the same browser actor", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/edge-reaction-design");
  const useful = page.getByRole("button", { name: /参考になった/ });
  await expect(useful).toBeEnabled();
  await useful.click();
  await expect(useful).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(useful).toHaveAttribute("aria-pressed", "true");
});

test("keyboard focus reaches navigation and display settings", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  await expect(page.locator(".settings[data-slot='collapsible-root']")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", "Lunacea ホーム");
  await page.getByText("Display", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Theme")).toBeVisible();
});

test(
  "core pages have no automatically detectable accessibility violations",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "no-javascript");
    for (const route of ["/", "/articles/resilient-content-pipeline", "/search?q=天候"]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, route).toEqual([]);
    }
  },
);

test("JavaScript-disabled reading and GET search remain usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "no-javascript");
  await page.goto("/articles/resilient-content-pipeline");
  await expect(page.getByRole("heading", { name: "壊れにくいコンテンツパイプラインを設計する" }))
    .toBeVisible();
  await expect(page.getByText("正本を一つにする")).toBeVisible();

  await page.goto("/search");
  await page.getByRole("searchbox").fill("天候");
  await page.getByRole("button", { name: "検索" }).click();
  await expect(page).toHaveURL(/q=%E5%A4%A9%E5%80%99/u);
  await expect(page.getByRole("link", { name: /天候をインターフェースの環境情報にする/ }))
    .toBeVisible();
});

test("404, feeds, sitemap, OGP, and health endpoint respond", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  const missing = await page.goto("/this-page-does-not-exist");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Record not found" })).toBeVisible();

  for (const route of ["/rss.xml", "/atom.xml", "/sitemap.xml", "/api/v1/health"]) {
    const response = await page.request.get(route);
    expect(response.ok(), route).toBe(true);
  }
  const og = await page.request.get("/og/article/resilient-content-pipeline.png");
  expect(og.ok()).toBe(true);
  expect(og.headers()["content-type"]).toBe("image/png");
  const siteOg = await page.request.get("/og/site.png");
  expect(siteOg.ok()).toBe(true);
  expect(siteOg.headers()["content-type"]).toBe("image/png");
});
