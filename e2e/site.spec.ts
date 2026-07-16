import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const primaryRoutes = ["/", "/articles", "/works", "/archive"];

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
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /環境・表示/ }).click();
  await page.getByLabel("Theme").selectOption("dark");
  await page.getByLabel("Motion").selectOption("off");
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
});

test("mobile navigation dismisses with Escape and returns focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
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

test("home is a continuous document with About and a deterministic non-WebGL fallback", async (
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
  expect(dimensions.document).toBeGreaterThan(dimensions.viewport);
  await expect(page.locator("#about")).toBeVisible();
  await expect(page.locator(".ambient")).toHaveAttribute("data-webgl", "false");
  await expect(page.locator(".ambient .fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("touch rotation preserves native vertical scrolling", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  const visual = page.locator(".ambient");
  await expect(visual).toHaveCSS("touch-action", "pan-y");
  const initialYaw = Number(await visual.getAttribute("data-yaw"));
  const cdp = await context.newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1, radiusX: 2, radiusY: 2 }];
  const hit = await page.evaluate(() => {
    for (let y = innerHeight - 80; y >= 160; y -= 40) {
      for (let x = innerWidth - 20; x >= 20; x -= 40) {
        if (document.elementFromPoint(x, y)?.closest(".ambient")) return { x, y };
      }
    }
    return null;
  });
  expect(hit).not.toBeNull();
  const movedX = Math.max(20, hit!.x - 80);

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(hit!.x, hit!.y),
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: point(movedX, hit!.y),
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(Number(await visual.getAttribute("data-yaw"))).not.toBe(initialYaw);

  await page.evaluate(() => scrollTo(0, 0));
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(hit!.x, hit!.y),
  });
  for (const distance of [50, 100, 150, 200, 250, 300]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(hit!.x, hit!.y - distance),
    });
    await page.waitForTimeout(60);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test("article has reading tools but never creates a WebGL canvas", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/resilient-content-pipeline");
  await expect(page.getByRole("heading", { name: "壊れにくいコンテンツパイプラインを設計する" }))
    .toBeVisible();
  await expect(page.getByRole("progressbar", { name: "読了進捗" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "目次" })).toBeVisible();
  const diagram = page.locator(".mermaid-diagram svg");
  await expect(diagram).toBeVisible({ timeout: 15_000 });
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
  // The first development request may include route compilation while the API initializes KV.
  await expect(useful).toBeEnabled({ timeout: 20_000 });
  await useful.click();
  await expect(useful).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(useful).toHaveAttribute("aria-pressed", "true");
});

test("keyboard focus reaches navigation and display settings", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", "Lunacea ホーム");
  await page.getByRole("button", { name: /環境・表示/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Theme")).toBeVisible();
});

test(
  "custom cursor yields to native form and text-selection cursors",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
    await page.goto("/articles");
    const heading = page.getByRole("heading", { name: "Articles" });
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();
    await page.mouse.move(headingBox!.x + 4, headingBox!.y + 4);
    await expect(page.locator("html")).toHaveAttribute("data-custom-cursor", "");

    const search = page.getByRole("searchbox");
    const searchBox = await search.boundingBox();
    expect(searchBox).not.toBeNull();
    await page.mouse.move(searchBox!.x + 4, searchBox!.y + 4);
    await expect(page.locator("html")).not.toHaveAttribute("data-custom-cursor");

    await page.evaluate(() => {
      const title = document.querySelector("h1");
      const selection = getSelection();
      if (!title || !selection) return;
      selection.selectAllChildren(title);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await page.mouse.move(headingBox!.x + 4, headingBox!.y + 4);
    await expect(page.locator("html")).not.toHaveAttribute("data-custom-cursor");
  },
);

test(
  "core pages have no automatically detectable accessibility violations",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "no-javascript");
    for (const route of ["/", "/articles/resilient-content-pipeline", "/articles?q=天候"]) {
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
  await expect(page.locator('.prose h2[id="正本を一つにする"]')).toBeVisible();

  await page.goto("/articles");
  await page.getByRole("searchbox").fill("天候");
  await page.getByRole("button", { name: "検索" }).click();
  await expect(page).toHaveURL(/q=%E5%A4%A9%E5%80%99/u);
  await expect(page.getByRole("link", { name: /天候をインターフェースの環境情報にする/ }))
    .toBeVisible();
});

test(
  "article filters expose the documented cache and indexing policy",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    const response = await page.goto("/articles?q=天候&sort=relevance");
    expect(response?.headers()["cache-control"]).toBe(
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/articles$/u);
    await expect(page.locator('meta[name="robots"][content="noindex,follow"]')).toHaveCount(1);
  },
);

test("legacy URLs use one-hop permanent redirects", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  const cases = [
    ["/talks", "/articles?category=talk"],
    ["/talks/quiet-interfaces", "/articles/quiet-interfaces"],
    ["/search?q=天候&type=talk", "/articles?q=%E5%A4%A9%E5%80%99&category=talk"],
    ["/about", "/#about"],
    ["/archive/photos", "/archive?kind=photos"],
    ["/og/talk/quiet-interfaces.png", "/og/article/quiet-interfaces.png"],
  ];
  for (const [from, to] of cases) {
    const response = await page.request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers().location, from).toBe(to);
  }
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

test("responsive archive images are emitted at their public URLs", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/archive");
  const source = page.locator('source[type="image/avif"]').first();
  const srcset = await source.getAttribute("srcset");
  expect(srcset).toContain("/images/generated/");
  const path = srcset?.split(",")[0].trim().split(" ")[0];
  expect(path).toBeTruthy();
  const image = await page.request.get(path!);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/avif");
});
