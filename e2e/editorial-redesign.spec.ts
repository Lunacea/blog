import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const HOME_INDEX = 'ol[aria-label="最新の記事"] > li';

// Functional acceptance for the redesigned Home; visual artifacts also cover the static design.
test(
  "editorial home remains complete across sizes, themes and motion modes",
  async ({ page }, info) => {
    test.setTimeout(240_000);
    for (const width of [390, 768, 1440]) {
      for (const theme of ["light", "dark"]) {
        for (const motion of ["full", "off"]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.addInitScript(({ theme, motion }) => {
            localStorage.setItem("lunacea-theme", theme);
            localStorage.setItem("lunacea-motion", motion);
          }, { theme, motion });
          await page.emulateMedia({ colorScheme: theme as "light" | "dark" });
          await page.goto("/");
          // The masthead can only be measured once its real face has loaded.
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator("#home-title")).toBeVisible();
          await expect(page.locator(HOME_INDEX)).toHaveCount(6);
          await expect(page.locator("#about")).toBeVisible();
          // Home carries no header bar; the masthead is the identity.
          await expect(page.getByRole("banner")).toHaveCount(0);
          // The masthead deliberately overflows, but the document never scrolls sideways.
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
            .toBeLessThanOrEqual(1);
          expect(
            await page.locator("#home-title").evaluate((element) =>
              element.getBoundingClientRect().width
            ),
          ).toBeGreaterThan(width);
          if (motion === "off" || info.project.name === "no-javascript") {
            await expect(page.locator("canvas")).toHaveCount(0);
          }
          await page.screenshot({
            path: info.outputPath(`home-${width}-${theme}-${motion}.png`),
            fullPage: true,
          });
        }
      }
    }
  },
);

test(
  "legacy reduced preference becomes OFF and the lunar disc toggles theme with keyboard",
  async ({ page }, info) => {
    test.skip(info.project.name === "no-javascript");
    await page.addInitScript(() => localStorage.setItem("lunacea-motion", "reduced"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
    const disc = page.locator("#home-title button");
    // The control only answers once Svelte has hydrated it.
    await expect(disc).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    await disc.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator(".settings-trigger").click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
    await page.locator(".settings-trigger").click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
    await page.goto("/articles");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  },
);

test("the catalog filters by category and by tag using GET", async ({ page }, info) => {
  await page.goto("/articles");
  const index = page.getByRole("list", { name: "記事一覧" });
  const all = await index.locator("> li").count();
  expect(all).toBeGreaterThan(1);

  // Category is the primary axis and lives in its own rail.
  const categories = page.getByRole("navigation", { name: "カテゴリ", exact: true });
  if (info.project.name === "mobile") {
    // Hydration folds the rail on phones; open it as a reader would before choosing a category.
    await expect(categories.locator("details")).not.toHaveAttribute("open");
    await categories.locator("summary").click();
  }
  await categories.getByRole("link").nth(1).click();
  await expect(page).toHaveURL(/category=/);
  await expect(index.locator("> li").first()).toBeVisible();

  // Tags are demoted to the closing panel but still filter through the same query string.
  const tag = page.getByRole("link", { name: /^#/ }).first();
  await tag.click();
  await expect(page).toHaveURL(/tag=/);
  await page.getByRole("link", { name: "Clear", exact: true }).click();
  await expect(page).not.toHaveURL(/category=|tag=/);
  await expect(index.locator("> li")).toHaveCount(all);
});

test("the catalog search narrows the index and reports an empty result", async ({ page }) => {
  await page.goto("/articles");
  await page.getByRole("searchbox").fill("鱻鱻鱻鱻鱻鱻");
  await page.getByRole("button", { name: "記事を検索", exact: true }).click();
  await expect(page.getByText("条件に一致する記事はありません。", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("list", { name: "記事一覧" })).toBeVisible();
});

test("Home light is optional and is disposed when motion turns off", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    localStorage.setItem("lunacea-motion", "full");
  });
  await page.goto("/");
  const light = page.locator("[data-editorial-light]");
  await expect(light).toHaveAttribute("data-webgl", "true", { timeout: 30_000 });
  await expect(light.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");
  await page.mouse.move(600, 250);
  await page.locator(".settings-trigger").click();
  await expect(light.locator("canvas")).toHaveCount(0);
  // The static light, the grain and every word survive the renderer going away.
  await expect(light).toBeAttached();
  await expect(page.locator("#home-title")).toBeVisible();
  await expect(page.locator(HOME_INDEX)).toHaveCount(6);
});

test(
  "mobile light keeps its drawing buffer through scroll and recovers to static on context loss",
  async ({ page }, info) => {
    test.skip(info.project.name !== "mobile");
    const gpuErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /WebGL|THREE|shader/i.test(message.text())) {
        gpuErrors.push(message.text());
      }
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
      localStorage.setItem("lunacea-motion", "full");
    });
    await page.goto("/");
    const light = page.locator("[data-editorial-light]");
    await expect(light).toHaveAttribute("data-webgl", "true", { timeout: 30_000 });
    const canvas = light.locator("canvas");
    await expect.poll(() => canvas.evaluate((node) => (node as HTMLCanvasElement).width))
      .toBeGreaterThan(300);
    const result = await canvas.evaluate(async (node) => {
      const canvas = node as HTMLCanvasElement;
      let reallocations = 0;
      const observer = new MutationObserver((entries) => {
        reallocations += entries.length;
      });
      observer.observe(canvas, { attributes: true, attributeFilter: ["width", "height"] });
      for (let step = 0; step < 12; step++) {
        globalThis.scrollBy(0, step < 6 ? 120 : -120);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      }
      observer.disconnect();
      return {
        reallocations,
        connected: canvas.isConnected,
        width: canvas.width,
        cssWidth: canvas.clientWidth,
      };
    });
    expect(result.reallocations).toBe(0);
    expect(result.connected).toBe(true);
    expect(result.width).toBeLessThanOrEqual(result.cssWidth);
    await expect(light.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");

    // Real viewport changes must still resize and redraw, unlike scroll-only updates.
    await page.setViewportSize({ width: 480, height: 760 });
    await expect.poll(() => canvas.evaluate((node) => (node as HTMLCanvasElement).width)).toBe(480);
    await page.screenshot({ path: info.outputPath("mobile-light-scroll.png") });
    expect(gpuErrors).toEqual([]);
    await canvas.evaluate((node) => {
      (node as HTMLCanvasElement).getContext("webgl2")!.getExtension("WEBGL_lose_context")!
        .loseContext();
    });
    await expect(canvas).toHaveCount(0);
    await expect(page.locator("#home-title")).toBeVisible();
    await expect(light).toBeAttached();
  },
);

test("OS restrictions and WebGL failure preserve all home content", async ({ page }, info) => {
  test.skip(info.project.name === "no-javascript");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind.includes("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(HOME_INDEX)).toHaveCount(6);
  await expect(page.locator("#home-title")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("article never fetches weather or imports the Home renderer", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/articles/resilient-content-pipeline");
  await expect(page.locator(".prose")).toBeVisible();
  expect(requests.filter((url) => /api\/v1\/weather|editorial-light|three\.js/.test(url))).toEqual(
    [],
  );
  await expect(page.locator("canvas")).toHaveCount(0);
  // Reading routes keep the static field only; the animated one is Home's alone.
  await expect(page.locator("[data-editorial-light]")).not.toHaveAttribute("data-webgl", "true");
});

test("opening never hides the document and always clears itself", async ({ page }, info) => {
  test.skip(info.project.name === "no-javascript");
  await page.goto("/");
  await expect(page.locator("#home-title")).toBeVisible();
  await expect(page.locator(HOME_INDEX)).toHaveCount(6);
  await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /active|pending/, {
    timeout: 30_000,
  });
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-home-opening", /active|pending/, {
    timeout: 30_000,
  });
});

test("enlarged type stays readable and controls remain accessible", async ({ page }, info) => {
  test.skip(info.project.name === "no-javascript");
  test.setTimeout(90_000);
  for (const route of ["/", "/articles", "/articles/resilient-content-pipeline"]) {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(route);
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
    await page.screenshot({
      path: info.outputPath(`enlarged-${route.replaceAll("/", "_")}.png`),
      fullPage: true,
    });
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
  }
});

test("retired resources return 404 and public article resources survive", async ({ request }) => {
  for (
    const path of [
      "/works",
      "/works/quiet-archive",
      "/archive",
      "/archive/photos",
      "/archive/photos/after-rain",
      "/og/work/quiet-archive.png",
      "/og/photo/after-rain.png",
    ]
  ) expect((await request.get(path)).status(), path).toBe(404);
  for (
    const path of [
      "/articles/resilient-content-pipeline",
      "/sitemap.xml",
      "/rss.xml",
      "/atom.xml",
      "/og/article/resilient-content-pipeline.png",
    ]
  ) expect((await request.get(path)).ok(), path).toBeTruthy();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toMatch(/\/works|\/archive/);
});

test("every surface stays readable across themes and enlarged text", async ({ page }, info) => {
  // Three routes times two themes with an axe audit each needs more than the default budget.
  test.setTimeout(60_000);
  for (const path of ["/articles", "/articles/resilient-content-pipeline", "/#about"]) {
    await page.goto(path);
    if (info.project.name !== "no-javascript") {
      // Hydration re-applies the stored preference, so it has to finish before the test writes one.
      await expect(page.locator(".theme-toggle").first()).toHaveAttribute("data-ready", "true", {
        timeout: 30_000,
      });
    }
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        const root = document.documentElement;
        root.dataset.motion = "off";
        getComputedStyle(root).transitionDuration;
        // Store the choice as well: hydration re-applies the stored preference and would
        // otherwise put the theme straight back.
        try {
          localStorage.setItem("lunacea-theme", value);
        } catch { /* Storage is optional. */ }
        root.dataset.themePreference = value;
        root.dataset.theme = value;
      }, theme);
      // Frame callbacks and animation promises never settle while scripting is disabled.
      if (info.project.name !== "no-javascript") {
        await page.evaluate(async () => {
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          await Promise.all(
            document.documentElement.getAnimations().map((animation) =>
              animation.finished.catch(() => {})
            ),
          );
        });
        // Each colour token has its own transition duration, so the audit waits for the slowest
        // of them; sampling mid-transition reports contrast that never appears on screen.
        const settled = theme === "dark"
          ? "rgb(238, 238, 236)|rgb(221, 221, 221)|rgb(204, 204, 204)|rgb(238, 238, 236)|rgb(192, 192, 192)"
          : "rgb(23, 23, 23)|rgb(34, 34, 34)|rgb(63, 63, 63)|rgb(23, 23, 23)|rgb(74, 74, 74)";
        await expect.poll(() =>
          page.evaluate(() => {
            const style = getComputedStyle(document.documentElement);
            return ["foreground", "primary", "secondary", "accent", "muted"]
              .map((token) => style.getPropertyValue(`--color-${token}`).trim())
              .join("|");
          }), { timeout: 15_000 }).toBe(settled);
      }
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        `${path} ${theme}`,
      ).toBe(false);
      if (info.project.name === "desktop") {
        const audit = await new AxeBuilder({ page }).include("main").analyze();
        expect(audit.violations).toEqual([]);
      }
    }
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), path)
      .toBe(false);
  }
});

test("the article minimap retains ordinary heading navigation", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "off"));
  await page.goto("/articles/resilient-content-pipeline");
  const map = page.locator(".desktop-toc [data-composition-graph]");
  await expect(map).toHaveAttribute("aria-hidden", "true");
  expect(await map.locator("rect").count()).toBeGreaterThan(0);
  await page.locator(".desktop-toc a").nth(1).click();
  await expect(page.locator(".desktop-toc a").nth(1)).toHaveAttribute("aria-current", "location");
  await page.goto("/articles");
  const record = page.getByRole("list", { name: "記事一覧" }).locator("h3 a").first();
  await record.focus();
  await expect(record).toBeFocused();
  await record.press("Enter");
  await expect(page).toHaveURL(/\/articles\/[^/]+$/);
});
