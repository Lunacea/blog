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
  const titleTheme = page.locator("#home-title .theme-toggle");
  const headerTheme = page.locator(".header-theme .theme-toggle");
  await headerTheme.hover();
  await expect.poll(() =>
    headerTheme.evaluate((element) => ({
      color: getComputedStyle(element).color,
      accent: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
      transform: getComputedStyle(element).transform,
    }))
  ).toEqual(expect.objectContaining({
    color: "rgb(112, 88, 0)",
    accent: "rgb(112, 88, 0)",
    transform: "none",
  }));
  await expect(titleTheme).toHaveAttribute("aria-label", "ダークテーマに切り替える");
  await expect.poll(() =>
    titleTheme.evaluate((element) => ({
      color: getComputedStyle(element).color,
      accent: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
    }))
  ).toEqual(expect.objectContaining({ color: "rgb(112, 88, 0)", accent: "rgb(112, 88, 0)" }));
  await titleTheme.hover();
  await expect(titleTheme).toHaveCSS("color", "rgb(112, 88, 0)");
  await titleTheme.click();
  await expect(page.getByRole("button", { name: "ライトテーマに切り替える" })).toHaveCount(2);
  await expect(page.locator(".header-theme .theme-toggle")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect.poll(() =>
    titleTheme.evaluate((element) => ({
      color: getComputedStyle(element).color,
      accent: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
    }))
  ).toEqual(expect.objectContaining({ color: "rgb(226, 198, 84)", accent: "rgb(226, 198, 84)" }));
  const display = page.getByRole("button", { name: /Display: Full/ });
  await display.hover();
  await expect(display).toHaveCSS("transform", "none");
  const headerControlAlignment = await page.locator(
    ".header-theme .theme-toggle, .header-display .settings-trigger",
  ).evaluateAll((controls) =>
    controls.map((control) => {
      const box = control.getBoundingClientRect();
      return box.top + box.height / 2;
    })
  );
  expect(Math.abs(headerControlAlignment[0] - headerControlAlignment[1])).toBeLessThanOrEqual(1);
  await display.click();
  await page.getByRole("button", { name: /Display: Reduced/ }).click();
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
  await expect(header.locator(".desktop-nav a")).toHaveText([
    "Home",
    "Articles",
    "Works",
    "Archive",
  ]);
  await expect(header.locator(".mobile-nav")).toBeHidden();
  await expect(header.locator(".desktop-nav a").nth(1)).toHaveAttribute("aria-current", "page");
  const navigationWidths = await header.locator(".desktop-nav a").evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().width)
  );
  expect(Math.max(...navigationWidths) - Math.min(...navigationWidths)).toBeLessThanOrEqual(1);
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
  const menuAlignment = await menu.evaluate((button) => {
    const buttonBox = button.getBoundingClientRect();
    const iconBox = button.querySelector(".menu-icon")!.getBoundingClientRect();
    return {
      background: getComputedStyle(button).backgroundColor,
      centerOffset: Math.abs(
        buttonBox.left + buttonBox.width / 2 - (iconBox.left + iconBox.width / 2),
      ),
    };
  });
  expect(menuAlignment.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(menuAlignment.centerOffset).toBeLessThanOrEqual(1);
  await menu.click();
  const navigation = page.getByRole("navigation", { name: "主要ナビゲーション（モバイル）" });
  await expect(navigation.getByRole("link")).toHaveText(["Home", "Articles", "Works", "Archive"]);
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
    const overlap = await page.evaluate(() => {
      const controls = document.querySelector(".control-region")?.getBoundingClientRect();
      const title = document.querySelector(".page > header")?.getBoundingClientRect();
      if (!controls || !title) return 0;
      return Math.max(
        0,
        Math.min(controls.right, title.right) - Math.max(controls.left, title.left),
      ) *
        Math.max(0, Math.min(controls.bottom, title.bottom) - Math.max(controls.top, title.top));
    });
    expect(overlap).toBe(0);
  }
});

test("non-Home initial content clears the fixed Header controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "no-javascript");
  for (
    const [path, selector] of [
      ["/articles", ".page > header"],
      ["/works", ".page > header"],
      ["/archive", ".page > header"],
      ["/articles/resilient-content-pipeline", ".article-header h1"],
    ] as const
  ) {
    await page.goto(path);
    const overlap = await page.evaluate(({ selector }) => {
      const controls = document.querySelector(".control-region")?.getBoundingClientRect();
      const content = document.querySelector(selector)?.getBoundingClientRect();
      if (!controls || !content) return 0;
      return Math.max(
        0,
        Math.min(controls.right, content.right) - Math.max(controls.left, content.left),
      ) *
        Math.max(
          0,
          Math.min(controls.bottom, content.bottom) - Math.max(controls.top, content.top),
        );
    }, { selector });
    expect(overlap, path).toBe(0);
  }
});

test("Grid and List use an item layout transition only in Full motion", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.addInitScript(() => {
    localStorage.setItem("lunacea-motion", "full");
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    let runs = 0;
    Object.defineProperty(globalThis, "__catalogTransitionRuns", {
      configurable: true,
      get: () => runs,
    });
    document.startViewTransition = (update) => {
      runs += 1;
      return original(update);
    };
  });
  await page.goto("/articles");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  await page.getByRole("link", { name: "グリッド表示" }).click();
  await expect(page).toHaveURL(/view=grid/u);
  await expect.poll(() =>
    page.evaluate(() =>
      Number(
        (globalThis as typeof globalThis & { __catalogTransitionRuns?: number })
          .__catalogTransitionRuns ?? 0,
      )
    )
  ).toBe(1);
  await expect(page.locator('[style*="catalog-article-"]').first()).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.motion = "off";
  });
  await page.getByRole("link", { name: "リスト表示" }).click();
  await expect(page).toHaveURL(/view=list/u);
  await expect.poll(() =>
    page.evaluate(() =>
      Number(
        (globalThis as typeof globalThis & { __catalogTransitionRuns?: number })
          .__catalogTransitionRuns ?? 0,
      )
    )
  ).toBe(1);
});

test("catalog controls preserve scroll and reserve reset space", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  const catalogProtection = await page.evaluate(() => {
    const noise = document.querySelector<HTMLElement>(".site-noise");
    const elements = [
      document.querySelector<HTMLElement>(".search-row"),
      document.querySelector<HTMLElement>(".filter-selector a"),
    ];
    return {
      noiseZ: Number.parseInt(getComputedStyle(noise!).zIndex, 10),
      surfaces: elements.map((element) => {
        const style = getComputedStyle(element!);
        return {
          background: style.backgroundColor,
          z: Number.parseInt(style.zIndex, 10),
        };
      }),
    };
  });
  for (const surface of catalogProtection.surfaces) {
    expect(surface.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(surface.z).toBeGreaterThan(catalogProtection.noiseZ);
  }
  const clearSlot = page.locator(".clear-slot");
  const initialHeight = await clearSlot.evaluate((element) =>
    element.getBoundingClientRect().height
  );
  await expect(page.getByRole("button", { name: "解除する条件はありません" })).toBeDisabled();

  const before = await page.evaluate(() => {
    scrollTo(0, Math.min(240, document.documentElement.scrollHeight - innerHeight));
    return scrollY;
  });
  expect(before).toBeGreaterThan(0);
  await page.locator(".filter-selector a").first().evaluate((element: HTMLAnchorElement) =>
    element.click()
  );
  await expect(page).toHaveURL(/category=/u);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  expect(await clearSlot.evaluate((element) => element.getBoundingClientRect().height)).toBe(
    initialHeight,
  );

  await page.getByRole("link", { name: "条件を解除" }).evaluate(
    (element: HTMLAnchorElement) => element.click(),
  );
  await expect(page).not.toHaveURL(/category=/u);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
});

test("article header compacts at the reading surface and restores on return", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/resilient-content-pipeline");
  const controls = page.locator(".control-region");
  await expect(controls).toHaveAttribute("data-article-compact", "false");
  await page.locator("[data-reading-start]").evaluate((marker) => {
    scrollTo(0, marker.getBoundingClientRect().top + scrollY + 80);
  });
  await expect(controls).toHaveAttribute("data-article-compact", "true");
  const articleFrames = await page.evaluate(() => {
    const header = document.querySelector(".article-header")?.getBoundingClientRect();
    const reading = document.querySelector(".reading-surface .article-grid")
      ?.getBoundingClientRect();
    return {
      headerWidth: header?.width ?? 0,
      readingWidth: reading?.width ?? 0,
      readingUsesReservedShell: document.querySelector(".reading-surface .content-shell") !== null,
    };
  });
  expect(articleFrames.readingUsesReservedShell).toBe(false);
  expect(articleFrames.readingWidth).toBeGreaterThan(articleFrames.headerWidth);
  const menu = page.locator(".menu-trigger");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("aria-label", "メニューを開く");
  const firstMenuLine = menu.locator(".menu-icon i").first();
  const restingLineTransform = await firstMenuLine.evaluate((line) =>
    getComputedStyle(line).transform
  );
  await menu.hover();
  await expect.poll(() => firstMenuLine.evaluate((line) => getComputedStyle(line).transform))
    .not.toBe(restingLineTransform);
  await menu.click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  const openIconTransform = await menu.locator(".menu-icon").evaluate((icon) =>
    getComputedStyle(icon).transform
  );
  const openLineTransforms = await menu.locator(".menu-icon i").evaluateAll((lines) =>
    lines.map((line) => getComputedStyle(line).transform)
  );
  await menu.hover();
  await page.waitForTimeout(250);
  expect(await menu.locator(".menu-icon").evaluate((icon) => getComputedStyle(icon).transform))
    .not.toBe(openIconTransform);
  expect(
    await menu.locator(".menu-icon i").evaluateAll((lines) =>
      lines.map((line) => getComputedStyle(line).transform)
    ),
  ).toEqual(openLineTransforms);
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();

  await page.evaluate(() => scrollTo(0, 0));
  await expect(controls).toHaveAttribute("data-article-compact", "false");
  await expect(page.locator(".desktop-nav")).toBeVisible();
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

test("page transitions finish the outgoing main before revealing the incoming main", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  const timing = await page.evaluate(() => {
    const oldStyle = getComputedStyle(
      document.documentElement,
      "::view-transition-old(page-content)",
    );
    const newStyle = getComputedStyle(
      document.documentElement,
      "::view-transition-new(page-content)",
    );
    return {
      mainName: getComputedStyle(document.querySelector("main")!).viewTransitionName,
      headerName: getComputedStyle(document.querySelector("header")!).viewTransitionName,
      oldDuration: oldStyle.animationDuration,
      newDelay: newStyle.animationDelay,
    };
  });
  expect(timing.mainName).toBe("page-content");
  expect(timing.headerName).toBe("none");
  expect(Number.parseFloat(timing.oldDuration)).toBeGreaterThan(0);
  expect(Number.parseFloat(timing.newDelay)).toBeGreaterThanOrEqual(
    Number.parseFloat(timing.oldDuration),
  );
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
  await expect(page.getByRole("link", { name: "View profile" })).toBeVisible();
  await expect(page.locator("[data-home-opening]")).toHaveCount(0);
  await expect(page.locator("[data-home-intro]")).toBeVisible();
  await expect(page.locator(".weather-fallback i")).toHaveCount(0);
  await expect(page.locator(".weather-fallback")).not.toHaveCSS(
    "background-image",
    /radial-gradient/u,
  );
  await expect(page.locator(".site-noise")).toBeVisible();
  await expect(page.locator(".site-noise")).toHaveCSS("opacity", "0.36");
  await expect(page.locator(".site-noise")).toHaveCSS(
    "background-image",
    /editorial-noise/u,
  );
  await expect(page.getByRole("heading", { level: 2, name: "Engineering" })).toBeVisible();
  const initialYaw = await page.locator(".ambient").getAttribute("data-yaw");
  await page.evaluate(() => scrollTo(0, innerHeight));
  await expect(page.locator(".ambient")).toHaveAttribute("data-yaw", initialYaw ?? "0");
});

test("Home WebGL point cloud reacts to a fine pointer and keeps rendering", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.goto("/");
  const ambient = page.locator(".ambient");
  await expect(ambient).toHaveAttribute("data-webgl", "true", { timeout: 15_000 });
  await expect(ambient.locator("canvas")).toHaveCount(1);
  const bounds = await ambient.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(
    bounds!.x + bounds!.width * .68,
    bounds!.y + bounds!.height * .3,
  );
  await expect(ambient).toHaveAttribute("data-repel-active", "1");
  expect(Number(await ambient.getAttribute("data-repel-x"))).toBeGreaterThan(.2);
  await page.locator(".desktop-nav a").first().hover();
  await expect(ambient).toHaveAttribute("data-repel-active", "0");
  await expect(ambient.locator("canvas")).toHaveCount(1);
});

test("Home profile card drag stays optional and inside the About region", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(60_000);
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
  await expect(card.locator(".roles > span")).toHaveText([
    "Interactive Systems",
    "Design Research",
  ]);

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
    await expect(card).toHaveAttribute("data-dragging", "true");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(start.x + 48, start.y + 24),
    });
    await page.waitForTimeout(50);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: start.x,
      y: start.y,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: start.x,
      y: start.y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: start.x + 96,
      y: start.y - 42,
      button: "left",
      buttons: 1,
    });
    await expect(card).toHaveAttribute("data-dragging", "true");
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: start.x + 96,
      y: start.y - 42,
      button: "left",
      buttons: 0,
      clickCount: 1,
    });
  }

  await expect(card).toHaveAttribute("data-dragging", "false");
  await expect.poll(async () => {
    const after = await card.boundingBox();
    return after ? Math.hypot(after.x - before!.x, after.y - before!.y) : 0;
  }).toBeGreaterThan(12);
  await expect(card).toHaveAttribute("data-inertial", "false");
  await expect.poll(() =>
    card.locator(".card-surface").evaluate((element) => ({
      inlineRotation: (element as HTMLElement).style.getPropertyValue("--card-rotate-z"),
      restingTilt: getComputedStyle(element).getPropertyValue("--profile-card-resting-tilt").trim(),
    }))
  ).toEqual({ inlineRotation: "", restingTilt: "-2deg" });

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

test("Home profile card disables inertia for reduced motion", async ({
  page,
  context,
}, testInfo) => {
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
  const start = { x: mediaBox!.x + 2, y: mediaBox!.y + 2 };
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: start.x,
    y: start.y,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: start.x,
    y: start.y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: start.x + 88,
    y: start.y - 30,
    button: "left",
    buttons: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: start.x + 88,
    y: start.y - 30,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
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
  await expect(page.locator(".article-header h1")).toHaveCSS(
    "font-family",
    /Newsreader|Hina Mincho/u,
  );
  await expect(page.locator(".reading-surface")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".article-header .tag-label svg").first()).toBeVisible();
  await expect(page.locator(".article-flags")).toContainText("更新中");
  await expect(page.locator(".article-dates")).toContainText("更新");
  await expect(page.locator(".status-badge")).toContainText("更新中");
  await expect(page.locator(".prose h2").first()).toHaveCSS("font-family", /Manrope|Zen Kaku/u);
  await expect(page.locator(".article-record")).toHaveCSS("background-image", "none");
  await expect(page.locator(".site-noise")).toBeVisible();
  await expect(page.locator(".site-noise")).toHaveAttribute("data-noise-motion", "reduced");
  await expect(page.locator(".site-noise")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".mermaid-diagram")).toBeVisible({ timeout: 15_000 });
  const protectedSurfaces = await page.evaluate(() => {
    const selectors = [".annotation", ".code-block", ".mermaid-diagram", ".link-card"];
    const noise = document.querySelector<HTMLElement>(".site-noise");
    const main = document.querySelector<HTMLElement>("main");
    return {
      noiseZ: Number.parseInt(getComputedStyle(noise!).zIndex, 10),
      mainZ: Number.parseInt(getComputedStyle(main!).zIndex, 10),
      surfaces: selectors.map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        const style = getComputedStyle(element!);
        return {
          background: style.backgroundColor,
          z: Number.parseInt(style.zIndex, 10),
        };
      }),
    };
  });
  expect(protectedSurfaces.mainZ).toBeGreaterThan(protectedSurfaces.noiseZ);
  for (const surface of protectedSurfaces.surfaces) {
    expect(surface.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(surface.z).toBeGreaterThan(protectedSurfaces.noiseZ);
  }
  await expect(page.getByText("この記録をどう感じましたか")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "関連記事" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "更新履歴" })).toBeVisible();
  await expect.poll(() => page.locator(".related .content-list > li > a").count())
    .toBeGreaterThan(0);
  const diagram = page.locator(".mermaid-diagram svg");
  await expect(diagram).toBeVisible({ timeout: 15_000 });
  const lightDiagramId = await diagram.getAttribute("id");
  const theme = page.locator(".header-theme").getByRole("button");
  const initialSurfaceColor = await page.locator(".annotation").evaluate((element) =>
    getComputedStyle(element).backgroundColor
  );
  await theme.click();
  await theme.click();
  await theme.click();
  await expect.poll(() => diagram.getAttribute("id")).not.toBe(lightDiagramId);
  await expect.poll(() =>
    page.locator(".annotation").evaluate((element) => getComputedStyle(element).backgroundColor)
  ).not.toBe(initialSurfaceColor);
  await theme.click();
  await expect(diagram).toBeVisible();
  await expect.poll(async () => {
    const diagramBox = await diagram.boundingBox();
    return diagramBox ? diagramBox.height < diagramBox.width : false;
  }).toBe(true);
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copy = page.getByRole("button", { name: "コードをコピー" }).first();
  await expect(copy).not.toHaveAttribute("title");
  const copyAlignment = await copy.evaluate((button) => {
    const block = button.closest<HTMLElement>(".code-block");
    const buttonBox = button.getBoundingClientRect();
    const blockBox = block!.getBoundingClientRect();
    const blockBorder = Number.parseFloat(getComputedStyle(block!).borderTopWidth);
    return {
      actual: buttonBox.top + buttonBox.height / 2 - blockBox.top,
      expected: blockBorder + 20,
    };
  });
  expect(copyAlignment.actual).toBeCloseTo(copyAlignment.expected, 0);
  await copy.click();
  await expect(copy).toHaveAttribute("data-copied", "true");
  await expect(copy).toHaveAttribute("aria-label", "コードをコピーしました");
});

test("article TOC tracks clicked headings and mobile disclosure animates", async ({
  page,
}, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
  await page.goto("/articles/resilient-content-pipeline");
  const linkCard = page.locator(".link-card");
  await expect(linkCard).toBeVisible();
  await expect(page.locator(".reading-surface")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".prose")).not.toHaveCSS("text-shadow", "none");
  const linkCardLayout = await linkCard.evaluate((element) => {
    const copy = element.querySelector<HTMLElement>(".copy");
    return {
      height: element.getBoundingClientRect().height,
      copyFits: copy ? copy.scrollHeight <= copy.clientHeight + 1 : false,
    };
  });
  expect(linkCardLayout.height).toBeGreaterThanOrEqual(
    testInfo.project.name === "mobile" ? 128 : 144,
  );
  expect(linkCardLayout.copyFits).toBe(true);
  if (testInfo.project.name === "desktop") {
    await expect(page.locator(".desktop-toc")).toHaveAttribute("data-ready", "true");
    await expect(page.locator(".mobile-toc-region")).toBeHidden();
    const link = page.locator('.desktop-toc a[href="#処理の流れ"]');
    await expect(link).toHaveCSS("font-size", "14px");
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "location");
    await expect(page.locator("#処理の流れ")).toBeInViewport();
    const track = await page.locator(".toc-list").evaluate((element) => ({
      beforeWidth: getComputedStyle(element, "::before").width,
      beforeHeight: getComputedStyle(element, "::before").height,
      activeWidth: getComputedStyle(element, "::after").width,
      activeTransform: getComputedStyle(element, "::after").transform,
    }));
    expect(track.beforeWidth).toBe("1px");
    expect(Number.parseFloat(track.beforeHeight)).toBeGreaterThan(0);
    expect(track.activeWidth).toBe("2px");
    expect(track.activeTransform).not.toBe("none");
    return;
  }
  const trigger = page.locator(".mobile-toc-trigger");
  await expect(trigger).toHaveCSS("font-size", "14px");
  await expect(page.locator(".desktop-toc")).toBeHidden();
  await expect(page.locator(".mobile-toc-region")).toHaveAttribute("data-ready", "true");
  await trigger.click();
  await expect(trigger).toHaveAttribute("data-state", "open");
  await expect(page.locator(".mobile-toc-content")).toHaveAttribute("data-state", "open");
  await trigger.click();
  await expect(page.locator(".mobile-toc-content")).toHaveAttribute("data-state", "closed");
});

test("Mermaid geometry stays intact in Reduced and Off", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  for (const mode of ["reduced", "off"]) {
    await page.evaluate((value) => localStorage.setItem("lunacea-motion", value), mode);
    await page.goto("/articles/resilient-content-pipeline");
    await expect(page.locator("html")).toHaveAttribute("data-motion", mode);
    const diagram = page.locator(".mermaid-diagram svg");
    await expect(diagram).toBeVisible({ timeout: 15_000 });
    const geometry = await diagram.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const viewBox = element.viewBox.baseVal;
      return {
        width: box.width,
        height: box.height,
        viewBox: element.getAttribute("viewBox"),
        viewBoxRatio: viewBox.width / viewBox.height,
        animation: getComputedStyle(element).animationName,
      };
    });
    expect(geometry.width).toBeGreaterThan(300);
    expect(geometry.height).toBeGreaterThan(40);
    expect(geometry.height).toBeLessThan(160);
    expect(geometry.viewBox).toBeTruthy();
    expect(geometry.viewBoxRatio).toBeGreaterThan(5);
    expect(geometry.animation).toBe("none");
    await expect(page.locator(".mermaid-source")).toBeHidden();
  }
});

test("Work detail uses vertical metadata and conditional external actions", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/works/quiet-archive");
  await expect(page.locator(".work-meta dt")).toHaveText(["Role", "Period", "Field"]);
  await expect(page.getByRole("link", { name: /View source/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Visit site/ })).toHaveCount(0);
  await expect(page.locator(".work-technologies li").first().locator("svg")).toBeVisible();
  await expect(page.locator(".reading-surface")).toHaveCSS("border-top-width", "0px");
});

test("Archive detail follows the media-led Work layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/archive/photos/after-rain");
  await expect(page.locator("article")).toHaveClass(/archive-record/u);
  await expect(page.locator(".archive-meta dt")).toContainText(["Kind", "Published"]);
  await expect(page.locator(".reading-surface")).toHaveCSS("border-top-width", "0px");
});

test("tag route uses the compact filtered catalog layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/tags/Design");
  await expect(page.getByRole("heading", { level: 1, name: "Tags" })).toBeVisible();
  await expect(page.locator(".tag-filter")).toContainText("Design");
  await expect(page.locator(".tag-filter")).toContainText(/records/u);
});

test("anonymous praise and share actions remain available", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/edge-reaction-design");
  const praise = page.locator("button.praise");
  await expect(praise).toHaveAccessibleName("称賛する");
  // The first development request may include route compilation while the API initializes KV.
  await expect(praise).toBeEnabled({ timeout: 20_000 });
  const idleBackground = await praise.evaluate((element) =>
    getComputedStyle(element).backgroundColor
  );
  await praise.hover();
  expect(
    Number.parseFloat(
      await praise.locator("svg").evaluate((element) => getComputedStyle(element).fontSize),
    ),
  ).toBeGreaterThan(20);
  await expect(praise.locator("svg")).toHaveCSS(
    "animation-name",
    /praise-heart-hover/u,
  );
  await praise.click();
  await expect(praise).toHaveAttribute("aria-pressed", "true");
  await expect(praise).toHaveCSS("background-color", idleBackground);
  await expect(praise.locator("svg")).toHaveAttribute(
    "data-icon-name",
    "solar:heart-bold",
  );
  await expect(praise.locator("svg")).toHaveCSS(
    "animation-name",
    /praise-heart-select/u,
  );
  await expect.poll(() =>
    praise.evaluate((element) => getComputedStyle(element, "::after").animationName)
  ).toMatch(/praise-burst/u);
  await page.reload();
  await expect(page.getByRole("button", { name: "称賛を取り消す" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("link", { name: "Share" })).toHaveAttribute(
    "href",
    /x\.com\/intent\/post/u,
  );
  await expect(page.getByRole("link", { name: "Bluesky" })).toHaveCount(0);
});

test("keyboard focus reaches navigation and display settings", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  const display = page.getByRole("button", { name: /Display:/ });
  await display.focus();
  await page.keyboard.press("Enter");
  await expect(display).toHaveAttribute("aria-label", /Display: (Reduced|Off)/);
});

test(
  "custom cursor yields to native form and text-selection cursors",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
    await page.goto("/articles");
    await expect(page.locator(".article-collection .copy").first()).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".article-collection .copy").first()).not.toHaveCSS(
      "text-shadow",
      "none",
    );
    const heading = page.getByRole("heading", { name: "Articles" });
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();
    await page.mouse.move(headingBox!.x + 4, headingBox!.y + 4);
    await expect(page.locator("html")).toHaveAttribute("data-custom-cursor", "");
    await expect(page.locator(".cursor-shape")).toHaveCSS(
      "animation-name",
      /cursor-square-spin/u,
    );

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

    await page.evaluate(() => {
      getSelection()?.removeAllRanges();
      document.dispatchEvent(new Event("selectionchange"));
    });
    const articlePreview = page.locator('main a[data-cursor-label="View more"]').first();
    const articlePreviewBox = await articlePreview.boundingBox();
    expect(articlePreviewBox).not.toBeNull();
    await page.mouse.move(
      articlePreviewBox!.x + articlePreviewBox!.width / 2,
      articlePreviewBox!.y + articlePreviewBox!.height / 2,
    );
    await expect(page.locator(".cursor")).toContainText("View more");
    const cursorShape = page.locator(".cursor-shape");
    await expect(cursorShape).toHaveCSS("border-top-width", "3px");
    await expect(cursorShape).toHaveCSS("border-radius", "0px");
    await expect(cursorShape).toHaveCSS(
      "animation-name",
      /cursor-settle-square/u,
    );
    const viewMoreShape = page.locator('.cursor[data-label="View more"] .cursor-shape');
    await page.waitForTimeout(700);
    const expandedWidth = await viewMoreShape.evaluate((element) =>
      element.getBoundingClientRect().width
    );
    await page.waitForTimeout(300);
    expect(await viewMoreShape.evaluate((element) => element.getBoundingClientRect().width)).toBe(
      expandedWidth,
    );
    const viewMoreFill = await viewMoreShape.evaluate((element) => {
      const style = getComputedStyle(element, "::before");
      return {
        animationName: style.animationName,
        backgroundRepeat: style.backgroundRepeat,
        backgroundSize: style.backgroundSize,
      };
    });
    expect(viewMoreFill.animationName).toMatch(/cursor-view-more-fill/u);
    expect(viewMoreFill.backgroundRepeat).toContain("repeat");
    expect(viewMoreFill.backgroundSize).toBe("208px 100%");
    expect(Number.parseFloat(viewMoreFill.backgroundSize)).toBeGreaterThan(expandedWidth);

    await page.goto("/articles/resilient-content-pipeline");
    await page.waitForTimeout(750);
    const paragraph = page.locator(".article-record .prose p").first();
    await paragraph.scrollIntoViewIfNeeded();
    const paragraphBox = await paragraph.boundingBox();
    expect(paragraphBox).not.toBeNull();
    await page.mouse.move(paragraphBox!.x + 8, paragraphBox!.y + 8);
    await expect(page.locator(".cursor")).toHaveAttribute("data-state", "reading-text");
    await expect(page.locator(".cursor-shape")).toHaveCSS("width", "3px");
    await expect(page.locator(".cursor-shape")).toHaveCSS(
      "animation-name",
      /cursor-settle-text/u,
    );
    await expect(page.locator(".cursor-shape")).toHaveCSS(
      "border-right-width",
      "3px",
    );
    const linkCard = page.locator(".link-card");
    await linkCard.scrollIntoViewIfNeeded();
    const linkCardBox = await linkCard.boundingBox();
    expect(linkCardBox).not.toBeNull();
    await page.mouse.move(
      linkCardBox!.x + linkCardBox!.width / 2,
      linkCardBox!.y + linkCardBox!.height / 2,
    );
    await expect(page.locator(".cursor")).toContainText("Open external");
    const copyButton = page.getByRole("button", { name: "コードをコピー" }).first();
    await copyButton.scrollIntoViewIfNeeded();
    const copyButtonBox = await copyButton.boundingBox();
    expect(copyButtonBox).not.toBeNull();
    await page.mouse.move(
      copyButtonBox!.x + copyButtonBox!.width / 2,
      copyButtonBox!.y + copyButtonBox!.height / 2,
    );
    await expect(page.locator(".cursor")).toContainText("Copy code");

    await page.goto("/");
    await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", {
      timeout: 20_000,
    });
    await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>("[data-home-about]");
      if (section) scrollTo(0, section.offsetTop);
    });
    const profileIdentity = page.locator(".identity-copy");
    await profileIdentity.scrollIntoViewIfNeeded();
    const profileIdentityBox = await profileIdentity.boundingBox();
    expect(profileIdentityBox).not.toBeNull();
    await page.mouse.move(
      profileIdentityBox!.x + profileIdentityBox!.width / 2,
      profileIdentityBox!.y + profileIdentityBox!.height / 2,
    );
    await expect(page.locator(".cursor")).toContainText("Drag it!");

    const contactList = page.locator(".contact-list");
    const contactListBox = await contactList.boundingBox();
    expect(contactListBox).not.toBeNull();
    await page.mouse.move(
      contactListBox!.x + contactListBox!.width - 4,
      contactListBox!.y + contactListBox!.height / 2,
    );
    await expect(page.locator(".cursor")).toContainText("Drag it!");

    const contactLink = contactList.locator("a").first();
    const contactLinkBox = await contactLink.boundingBox();
    expect(contactLinkBox).not.toBeNull();
    await page.mouse.move(
      contactLinkBox!.x + contactLinkBox!.width / 2,
      contactLinkBox!.y + contactLinkBox!.height / 2,
    );
    await expect(page.locator(".cursor")).toHaveText("");
    await expect(cursorShape).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(cursorShape).toHaveCSS(
      "animation-name",
      /cursor-settle-diamond/u,
    );

    await page.goto("/articles");
    await page.getByRole("button", { name: "Display: Full" }).click();
    const reducedPreview = page.locator('main a[data-cursor-label="View more"]').first();
    const reducedPreviewBox = await reducedPreview.boundingBox();
    expect(reducedPreviewBox).not.toBeNull();
    await page.mouse.move(
      reducedPreviewBox!.x + reducedPreviewBox!.width / 2,
      reducedPreviewBox!.y + reducedPreviewBox!.height / 2,
    );
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
    await expect(page.locator(".cursor")).toContainText("View more");
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
  await page.getByRole("button", { name: "記事を検索" }).click();
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
    ["/about", "/#about"],
    ["/about?ref=legacy", "/?ref=legacy#about"],
    [
      "/search?q=天候&tag=Deno&category=engineering&sort=updated&view=grid",
      "/articles?q=%E5%A4%A9%E5%80%99&tag=Deno&category=engineering&sort=updated&view=grid",
    ],
    ["/archive/photos", "/archive?kind=photos"],
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
