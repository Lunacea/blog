import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const primaryRoutes = ["/", "/articles"];

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
  await expect(page.getByRole("navigation", { name: "主要ナビゲーション" })).toBeVisible();
});

test("theme and binary motion preferences survive navigation", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.goto("/");
  await expect(page.locator("#home-title .theme-toggle")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });
  await page.locator("#home-title .theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator(".settings-trigger").click();
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
});

test("the hairline bar carries the wordmark, the navigation and both controls", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: /^lunacea$/i })).toBeVisible();
  const navigation = header.getByRole("navigation", { name: "主要ナビゲーション" });
  await expect(navigation.getByRole("link")).toHaveText(["Home", "Articles"]);
  await expect(navigation.getByRole("link").nth(1)).toHaveAttribute("aria-current", "page");
  // The C of the wordmark is the sun-and-moon mark, decorative: the link still goes Home.
  await expect(header.locator("a .theme-glyph")).toHaveCount(1);
  await expect(header.locator("a button")).toHaveCount(0);
  // Both preference controls sit in the bar, and the footer keeps its own pair.
  await expect(header.locator(".header-theme button")).toBeVisible();
  await expect(header.locator(".header-display button")).toBeVisible();
  await expect(page.getByRole("contentinfo").locator(".settings-trigger")).toHaveCount(1);
  // The bar sits in the document flow, so it scrolls away and can never cover a target.
  const before = await header.boundingBox();
  expect(before?.y ?? -1).toBeLessThanOrEqual(1);
  await page.evaluate(() => scrollTo(0, 600));
  const after = await header.boundingBox();
  expect(after?.y ?? 0).toBeLessThan(before?.y ?? 0);
  // Home replaces the bar with the masthead entirely.
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveCount(0);
});

test("the bar stays usable and tappable on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/articles");
  const header = page.getByRole("banner");
  const links = header.getByRole("navigation", { name: "主要ナビゲーション" }).getByRole("link");
  await expect(links).toHaveText(["Home", "Articles"]);
  const heights = await links.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().height)
  );
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  await links.first().click();
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.locator("#home-title")).toBeVisible();
});

test("the catalog closing panel stays keyboard-operable on mobile", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/articles");
  // Search and tags close the page instead of gating it, so they need no disclosure at all.
  const search = page.getByRole("searchbox");
  await expect(search).toBeVisible();
  await search.focus();
  await expect(search).toBeFocused();
  const tag = page.getByRole("link", { name: /^#/ }).first();
  const size = await tag.evaluate((element) => element.getBoundingClientRect().height);
  expect(size).toBeGreaterThanOrEqual(44);
  await tag.click();
  await expect(page).toHaveURL(/tag=/u);
});

test("OS reduced motion caps a saved Full preference", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-preference", "full");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("forced colors disables custom scroll colors and WebGL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.emulateMedia({ forcedColors: "active" });
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
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
      const bar = document.querySelector("header")?.getBoundingClientRect();
      const title = document.querySelector("main h1")?.getBoundingClientRect();
      if (!bar || !title) return 0;
      return Math.max(0, Math.min(bar.right, title.right) - Math.max(bar.left, title.left)) *
        Math.max(0, Math.min(bar.bottom, title.bottom) - Math.max(bar.top, title.top));
    });
    expect(overlap).toBe(0);
  }
});

test("the hairline bar never covers the first content of a route", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "no-javascript");
  for (
    const [path, selector] of [
      ["/articles", "main h1"],
      ["/articles/resilient-content-pipeline", ".article-header h1"],
    ] as const
  ) {
    await page.goto(path);
    const overlap = await page.evaluate(({ selector }) => {
      const bar = document.querySelector("header")?.getBoundingClientRect();
      const content = document.querySelector(selector)?.getBoundingClientRect();
      if (!bar || !content) return 0;
      return Math.max(0, Math.min(bar.right, content.right) - Math.max(bar.left, content.left)) *
        Math.max(0, Math.min(bar.bottom, content.bottom) - Math.max(bar.top, content.top));
    }, { selector });
    expect(overlap, path).toBe(0);
  }
});

test(
  "Home opening runs on every document load and reduced motion skips it",
  async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("lunacea-motion", "full");
      sessionStorage.clear();
    });
    await page.goto("/");
    // The inline script declares the opening before the first paint, so it is already active
    // here rather than starting once hydration lands.
    await expect(page.locator("html")).toHaveAttribute("data-home-opening", "active");
    await expect(page.locator(".home-opening")).toHaveCount(0, { timeout: 3_000 });
    await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-home-opening", "active");
    await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u);
    await context.close();

    const reduced = await browser.newContext({ reducedMotion: "reduce" });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto("/");
    await expect(reducedPage.locator("html")).not.toHaveAttribute("data-home-opening", /.+/u);
    await reduced.close();
  },
);

test("desktop Article TOC uses a vertical composition graph with bounded rows", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/resilient-content-pipeline");
  const toc = page.locator(".desktop-toc");
  await expect(toc.locator("[data-composition-graph]")).toBeVisible();
  const rows = await toc.locator(".toc-list > li").evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().height)
  );
  expect(Math.min(...rows)).toBeGreaterThanOrEqual(32);
  const graphAlignment = await toc.locator(".toc-composition").evaluate((composition) => {
    const list = composition.querySelector<HTMLElement>(".toc-list")!;
    const graph = composition.querySelector<SVGElement>("[data-composition-graph]")!;
    const firstLink = list.querySelector<HTMLAnchorElement>("a")!;
    const marker = getComputedStyle(list, "::after");
    return {
      graphWidth: graph.getBoundingClientRect().width,
      graphOpacity: getComputedStyle(graph.parentElement!).opacity,
      linkGap: firstLink.getBoundingClientRect().left - graph.getBoundingClientRect().right,
      markerTransform: marker.transform,
      markerWidth: marker.width,
      trackLeft: list.getBoundingClientRect().left,
    };
  });
  expect(graphAlignment.graphWidth).toBe(48);
  expect(graphAlignment.graphOpacity).toBe("1");
  expect(graphAlignment.linkGap).toBeGreaterThanOrEqual(16);
  expect(graphAlignment.markerWidth).toBe("2px");
  expect(graphAlignment.markerTransform).not.toContain("-2");
  await expect.poll(() =>
    toc.locator(".toc-list").evaluate((list) => getComputedStyle(list, "::after").backgroundColor)
  ).toBe("rgb(23, 23, 23)");
  const themeControl = page.getByRole("button", { name: "ダークテーマに切り替える" }).first();
  await expect(themeControl).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
  await themeControl.click();
  await expect.poll(() =>
    toc.locator(".toc-list").evaluate((list) => getComputedStyle(list, "::after").backgroundColor)
  ).toBe("rgb(238, 238, 236)");
  expect(await toc.locator("[data-composition-graph] rect").count()).toBeGreaterThan(0);
  await toc.locator(".toc-list a").nth(1).click();
  await expect(toc.locator(".toc-list a").nth(1)).toHaveAttribute("aria-current", "location");
  const marker = await toc.locator(".toc-list").evaluate((list) => {
    const current = list.querySelector('a[aria-current="location"]')?.closest("li");
    return {
      expected: (current as HTMLElement | null)?.offsetTop ?? -1,
      actual: Number.parseFloat((list as HTMLElement).style.getPropertyValue("--toc-marker-y")),
    };
  });
  expect(marker.actual).toBeCloseTo(marker.expected, 1);
});

test("back and forward navigation preserve route usability", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  await page.goto("/articles?view=list");
  await page.goBack();
  await expect(page).toHaveURL(/\/articles$/u);
  await expect(page.locator("main")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/articles\?view=list$/u);
  await expect(page.locator("main")).toBeVisible();
});

test("page transitions dissolve the whole page without blanking the shell", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles");
  const timing = await page.evaluate(() => {
    const oldStyle = getComputedStyle(
      document.documentElement,
      "::view-transition-old(root)",
    );
    const newStyle = getComputedStyle(
      document.documentElement,
      "::view-transition-new(root)",
    );
    return {
      mainName: getComputedStyle(document.querySelector("main")!).viewTransitionName,
      headerName: getComputedStyle(document.querySelector("header")!).viewTransitionName,
      rowName: getComputedStyle(document.querySelector(".index-list > li")!).viewTransitionName,
      oldDuration: oldStyle.animationDuration,
      newDelay: newStyle.animationDelay,
    };
  });
  // Nothing inside the page owns a transition name: the root snapshot is the whole page, so the
  // crossing is the same wherever the reader had scrolled to.
  expect(timing.mainName).toBe("none");
  expect(timing.headerName).toBe("none");
  expect(timing.rowName).toBe("none");
  // The incoming image starts before the outgoing one has finished, so the header and the footer
  // never drop out for a frame.
  expect(Number.parseFloat(timing.oldDuration)).toBeGreaterThan(0);
  expect(Number.parseFloat(timing.newDelay)).toBeGreaterThan(0);
  expect(Number.parseFloat(timing.newDelay)).toBeLessThan(
    Number.parseFloat(timing.oldDuration),
  );
});

test("article has reading tools but never creates a WebGL canvas", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/articles/resilient-content-pipeline");
  await expect(page.getByRole("heading", { name: "壊れにくいコンテンツパイプラインを設計する" }))
    .toBeVisible();
  await expect(page.getByRole("progressbar", { name: "読了進捗" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "目次" })).toBeVisible();
  await expect(page.locator(".article-header h1")).toHaveCSS("font-family", /Archivo/u);
  await expect(page.locator(".reading-surface")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".article-header .category-label")).toContainText("engineering");
  await expect(page.locator(".article-flags")).toContainText("更新中");
  await expect(page.locator(".article-dates")).toContainText("更新");
  await expect(page.locator(".status-badge")).toContainText("更新中");
  await expect(page.locator(".prose h2").first()).toHaveCSS("font-family", /Archivo|Zen Kaku/u);
  await expect(page.locator(".article-record")).toHaveCSS("background-image", "none");
  await expect(page.locator(".site-noise")).toHaveCount(0);
  await expect(page.locator(".mermaid-diagram")).toBeVisible({ timeout: 15_000 });
  const protectedSurfaces = await page.evaluate(() => {
    const selectors = [".annotation", ".code-block", ".mermaid-diagram", ".link-card"];
    const main = document.querySelector<HTMLElement>("main");
    return {
      noiseZ: 0,
      mainZ: Number.parseInt(getComputedStyle(main!).zIndex, 10),
      surfaces: selectors.map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        const style = getComputedStyle(element!);
        return {
          background: style.backgroundColor,
          z: Number.parseInt(
            getComputedStyle(element!.closest(".search-row") ?? element!).zIndex,
            10,
          ),
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
  await expect.poll(() => page.locator('.related ol[aria-label="関連記事"] > li h3 a').count())
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
    const track = await page.locator(".desktop-toc .toc-list").evaluate((element) => ({
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
  const trigger = page.locator(".mobile-toc-js .mobile-toc-trigger");
  await expect(trigger).toHaveCSS("font-size", "14px");
  await expect(trigger).toContainText("目次");
  await expect(trigger).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const rules = trigger.locator(".index-glyph path");
  await expect(rules).toHaveCount(3);
  const foldedMiddle = await rules.nth(1).evaluate((rule) => rule.getBoundingClientRect().width);
  await expect(page.locator(".desktop-toc")).toBeHidden();
  await expect(page.locator(".mobile-toc-region")).toHaveAttribute("data-ready", "true");
  await trigger.click();
  await expect(trigger).toHaveAttribute("data-state", "open");
  await expect(page.locator(".mobile-toc-content")).toHaveAttribute("data-state", "open");
  await expect.poll(() =>
    page.locator(".mobile-toc-content ol").evaluate((list) =>
      getComputedStyle(list, "::before").width
    )
  ).toBe("1px");
  // The three index rules collapse into the single full-width rule while the list is open.
  await expect(rules.first()).toHaveCSS("opacity", "0");
  await expect.poll(() => rules.nth(1).evaluate((rule) => rule.getBoundingClientRect().width))
    .toBeGreaterThan(foldedMiddle);
  await trigger.click();
  await expect(page.locator(".mobile-toc-content")).toHaveAttribute("data-state", "closed");
});

test("Mermaid geometry stays intact in Reduced and Off", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  for (const mode of ["reduced", "off"]) {
    await page.evaluate((value) => localStorage.setItem("lunacea-motion", value), mode);
    await page.goto("/articles/resilient-content-pipeline");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
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

test(
  "tag pages are retired and detail labels target filtered catalogs",
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    const response = await page.goto("/tags/Design");
    expect(response?.status()).toBe(404);
    await page.goto("/articles/resilient-content-pipeline");
    await expect(page.getByRole("link", { name: "#Deno", exact: true })).toHaveAttribute(
      "href",
      "/articles?tag=Deno",
    );
  },
);

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
  const glyphBox = await praise.locator(".heart-glyph").boundingBox();
  expect(glyphBox?.width ?? 0).toBeGreaterThan(32);
  // Hover scales the heart through a transition rather than a permanent animation.
  await expect(praise.locator(".heart-glyph")).toHaveCSS("transition-property", /scale/);
  await praise.click();
  await expect(praise).toHaveAttribute("aria-pressed", "true");
  await expect(praise).toHaveCSS("background-color", idleBackground);
  // The praise glyph is drawn locally, so selection is carried by its filled state.
  await expect(praise.locator(".heart-glyph")).toHaveAttribute("data-filled", "true");
  // The acknowledgement is one ring around the control; it never covers the page.
  const celebration = page.locator("[data-praise-celebration]");
  await expect(celebration).toHaveCount(1);
  await expect(celebration).toHaveCSS("animation-name", /praise-liquid/u);
  const glyphArea = await celebration.boundingBox();
  expect(glyphArea?.width ?? 999).toBeLessThan(120);
  await expect(celebration).toHaveCount(0, { timeout: 5_000 });
  await page.reload();
  // The stored selection arrives with the first reaction read, not with the document.
  await expect(page.locator("button.praise")).toBeEnabled({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "称賛を取り消す" })).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: 20_000 },
  );
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Post" })).toHaveAttribute(
    "href",
    /x\.com\/intent\/post/u,
  );
  await expect(page.getByRole("link", { name: "Bluesky" })).toHaveCount(0);
});

test("keyboard focus reaches navigation and display settings", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  const display = page.getByRole("button", { name: /アニメーション:/ });
  await display.focus();
  await page.keyboard.press("Enter");
  await expect(display).toHaveAttribute("aria-label", /アニメーション: OFF/);
});

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
      "/articles?q=%E5%A4%A9%E5%80%99&tag=Deno&category=engineering&sort=updated&view=list",
    ],
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
