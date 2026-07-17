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
  await expect(page.getByRole("navigation", { name: "JavaScriptなしのサイトナビゲーション" }))
    .toBeVisible();
});

test("theme and motion preferences survive navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", { timeout: 20_000 });
  await page.locator("#home-title").getByRole("button", { name: "ダークテーマに切り替える" })
    .click();
  await expect(page.getByRole("button", { name: "ライトテーマに切り替える" })).toHaveCount(2);
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByRole("group", { name: "Motion" }).getByRole("button", { name: "Off" }).click();
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
});

test("desktop header is a transparent fixed control region with vertical navigation", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  const header = page.getByRole("banner");
  await expect(header.locator(".desktop-nav a")).toHaveText(["Articles", "Works", "Archive"]);
  await expect(header.locator(".mobile-nav")).toBeHidden();
  await expect(header.locator(".desktop-nav a").first()).toHaveAttribute("aria-current", "page");
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const before = await header.locator(".control-region").boundingBox();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const after = await header.locator(".control-region").boundingBox();
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
});

test("mobile navigation dismisses with Escape and returns focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });
  const menu = page.getByRole("button", { name: /メニュー/ });
  const actions = page.locator(".header-actions > *");
  await expect(actions).toHaveCount(3);
  await menu.click();
  const navigation = page.getByRole("navigation", { name: "主要ナビゲーション（モバイル）" });
  await expect(navigation.getByRole("link")).toHaveText(["Articles", "Works", "Archive"]);
  await expect(navigation.getByText(/RSS|Atom|Sitemap|About|Search/)).toHaveCount(0);
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});

test(
  "an open mobile menu closes when the desktop breakpoint is crossed",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", {
      timeout: 20_000,
    });
    const menu = page.locator(".menu-trigger");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  },
);

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
    continuum: document.querySelector(".home-continuum")?.getBoundingClientRect().height ?? 0,
    visual: document.querySelector(".visual-surface")?.getBoundingClientRect().toJSON() ?? null,
    snap: getComputedStyle(document.documentElement).scrollSnapType,
  }));
  expect(dimensions.document).toBeGreaterThan(dimensions.viewport);
  expect(dimensions.continuum).toBeGreaterThanOrEqual(dimensions.viewport * 2 - 1);
  // Chromium omits the default `proximity` keyword when serializing the computed shorthand.
  expect(["y", "y mandatory"]).toContain(dimensions.snap);
  expect(dimensions.visual?.left).toBe(0);
  expect(dimensions.visual?.right).toBe(1440);
  expect(dimensions.visual?.height).toBeGreaterThanOrEqual(dimensions.viewport * 2 - 1);
  await expect(page.locator("#about")).toBeVisible();
  await expect(page.locator(".ambient")).toHaveAttribute("data-webgl", "false");
  await expect(page.locator(".ambient .fallback")).toBeHidden();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Lunacea" })).toBeVisible();
  await expect(page.locator(".sample-banner")).toHaveCount(0);
  await expect(page.getByText(/Environment|°C|地点/)).toHaveCount(0);
  await expect(page.locator(".profile-card").getByText("Engineering")).toHaveCount(0);
  await expect(page.locator(".about-introduction")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Engineering" })).toBeVisible();
  const initialYaw = await page.locator(".ambient").getAttribute("data-yaw");
  await page.evaluate(() => scrollTo(0, innerHeight));
  await expect(page.locator(".ambient")).toHaveAttribute("data-yaw", initialYaw ?? "0");
});

test("Home profile card drag stays optional and inside the About region", async ({
  page,
  context,
}, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
  if (testInfo.project.name === "mobile") {
    // Keep the mobile navigation breakpoint while leaving enough horizontal room to observe
    // post-release travel before the compact card reaches its boundary.
    await page.setViewportSize({ width: 600, height: 900 });
  }
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });
  const card = page.locator(".profile-card");
  const media = card.locator(".profile-media");
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>("[data-home-about]");
    if (section) scrollTo(0, section.offsetTop);
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600);
  await expect(card).toBeVisible();

  const before = await card.boundingBox();
  const mediaBox = await media.boundingBox();
  expect(before).not.toBeNull();
  expect(mediaBox).not.toBeNull();
  const start = { x: mediaBox!.x + 2, y: mediaBox!.y + 2 };

  if (testInfo.project.name === "mobile") {
    const cdp = await context.newCDPSession(page);
    const point = (x: number, y: number) => [{ x, y, id: 1, radiusX: 2, radiusY: 2 }];
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: point(start.x, start.y),
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(start.x + 30, start.y),
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(start.x + 48, start.y + 24),
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 96, start.y - 42, { steps: 4 });
    await expect(card).toHaveAttribute("data-dragging", "true");
    await page.mouse.up();
  }

  await expect(card).toHaveAttribute("data-dragging", "false");
  await expect(card).toHaveAttribute("data-inertial", "true");
  await expect.poll(async () => {
    const after = await card.boundingBox();
    return after ? Math.hypot(after.x - before!.x, after.y - before!.y) : 0;
  }).toBeGreaterThan(12);
  await expect(card).toHaveAttribute("data-inertial", "false");

  const contained = await page.evaluate(() => {
    const cardElement = document.querySelector<HTMLElement>(".profile-card");
    const aboutElement = document.querySelector<HTMLElement>("#about");
    if (!cardElement || !aboutElement) return false;
    const cardRect = cardElement.getBoundingClientRect();
    const aboutRect = aboutElement.getBoundingClientRect();
    const style = getComputedStyle(aboutElement);
    return cardRect.left >= aboutRect.left + parseFloat(style.paddingLeft) - 1 &&
      cardRect.right <= aboutRect.right - parseFloat(style.paddingRight) + 1 &&
      cardRect.top >= aboutRect.top + parseFloat(style.paddingTop) - 1 &&
      cardRect.bottom <= aboutRect.bottom - parseFloat(style.paddingBottom) + 1;
  });
  expect(contained).toBe(true);

  await page.setViewportSize(
    testInfo.project.name === "mobile" ? { width: 360, height: 800 } : { width: 960, height: 720 },
  );
  await expect.poll(() =>
    page.evaluate(() => {
      const cardElement = document.querySelector<HTMLElement>(".profile-card");
      const aboutElement = document.querySelector<HTMLElement>("#about");
      if (!cardElement || !aboutElement) return false;
      const cardRect = cardElement.getBoundingClientRect();
      const aboutRect = aboutElement.getBoundingClientRect();
      const style = getComputedStyle(aboutElement);
      return cardRect.left >= aboutRect.left + parseFloat(style.paddingLeft) - 1 &&
        cardRect.right <= aboutRect.right - parseFloat(style.paddingRight) + 1 &&
        cardRect.top >= aboutRect.top + parseFloat(style.paddingTop) - 1 &&
        cardRect.bottom <= aboutRect.bottom - parseFloat(style.paddingBottom) + 1;
    })
  ).toBe(true);
});

test("Home profile card disables inertia for reduced motion", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "reduced"));
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>("[data-home-about]");
    if (section) scrollTo(0, section.offsetTop);
  });
  const card = page.locator(".profile-card");
  const mediaBox = await card.locator(".profile-media").boundingBox();
  expect(mediaBox).not.toBeNull();
  await page.mouse.move(mediaBox!.x + 2, mediaBox!.y + 2);
  await page.mouse.down();
  await page.mouse.move(mediaBox!.x + 88, mediaBox!.y - 30, { steps: 4 });
  await page.mouse.up();
  await expect(card).toHaveAttribute("data-dragging", "false");
  await expect(card).toHaveAttribute("data-inertial", "false");
});

test("Home mandatory snap responds to a small directional wheel gesture", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "off"));
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });
  await page.mouse.wheel(0, 56);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600);
  await page.waitForTimeout(150);
  await page.mouse.wheel(0, -56);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(100);
});

test("touch rotation preserves native vertical scrolling", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  const visual = page.locator(".ambient");
  await expect(visual).toHaveCSS("touch-action", "pan-y");
  const initialYaw = Number(await visual.getAttribute("data-yaw"));
  const cdp = await context.newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1, radiusX: 2, radiusY: 2 }];
  const hit = await page.evaluate(() => {
    for (let y = innerHeight - 80; y >= 160; y -= 40) {
      for (let x = innerWidth - 20; x >= 20; x -= 40) {
        if (document.elementFromPoint(x, y)?.closest(".ambient")) {
          return { x, y, width: innerWidth };
        }
      }
    }
    return null;
  });
  expect(hit).not.toBeNull();
  const movedX = hit!.x > hit!.width / 2
    ? Math.max(20, hit!.x - 80)
    : Math.min(hit!.width - 20, hit!.x + 80);

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(hit!.x, hit!.y),
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: point(movedX, hit!.y),
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => Number(await visual.getAttribute("data-yaw"))).not.toBe(initialYaw);

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
  await page.getByRole("button", { name: "Display" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Motion")).toBeVisible();
  await expect(page.locator(".panel").getByLabel("Theme")).toHaveCount(0);
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
    test.setTimeout(60_000);
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
    ["/about?ref=legacy", "/?ref=legacy#about"],
    [
      "/search?q=天候&tag=Deno&category=engineering&sort=updated&view=grid",
      "/articles?q=%E5%A4%A9%E5%80%99&tag=Deno&category=engineering&sort=updated&view=grid",
    ],
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
