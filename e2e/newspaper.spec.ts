import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the Header search drives the catalog and conditions clear back to the newspaper", async (
  { page },
  info,
) => {
  const enhanced = info.project.name !== "no-javascript";
  await page.goto("/articles");
  // The newspaper front leads with one story, keeps the daily box and indexes the rest in the rail.
  await expect(page.locator('[data-article-preview="lead"]')).toHaveCount(1);
  await expect(page.getByRole("complementary", { name: "本日のPick Up" })).toBeVisible();
  await expect(page.locator(".article-rail li").first()).toBeVisible();
  const previews = await page.locator("main [data-article-preview]").count();
  expect(previews).toBeGreaterThan(0);
  await expect(page.locator("main [data-article-preview] [data-paper-mark]")).toHaveCount(previews);
  await expect(page.getByRole("navigation", { name: "カテゴリ" })).toBeVisible();
  if (enhanced) {
    // The catalog body no longer owns a search field; the Header disclosure does.
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    await page.getByRole("button", { name: "記事を検索", exact: true }).first().click();
  }
  await page.getByRole("searchbox").fill("鱻鱻鱻鱻鱻鱻");
  await page.getByRole("button", { name: "記事を検索", exact: true }).last().click();
  await expect(page).toHaveURL(/view=list/);
  await expect(page.getByText("条件に一致する記事はありません。", { exact: false })).toBeVisible();

  await page.getByRole("link", { name: "条件を解除", exact: true }).click();
  await expect(page).toHaveURL(/\/articles\?view=list$/);
  // The list stays the complete index of every published article.
  await expect(page.locator(".article-collection > li")).toHaveCount(7);
  await page.getByRole("link", { name: "新聞", exact: true }).click();
  await expect(page).toHaveURL(/\/articles$/);
  await expect(page.getByRole("complementary", { name: "本日のPick Up" })).toBeVisible();
});

test("a category keeps the newspaper layout and stays reachable from every record", async ({ page }) => {
  await page.goto("/articles");
  await page.getByRole("navigation", { name: "カテゴリ" }).getByRole("link", { name: /^talk/ })
    .click();
  await expect(page).toHaveURL(/category=talk/);
  await expect(page.locator('[data-article-preview="lead"]')).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "カテゴリ" })).toBeVisible();
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

test("paper layouts remain readable across themes and enlarged text", async ({ page }, info) => {
  // Four routes times two themes with an axe audit each needs more than the default budget.
  test.setTimeout(60_000);
  for (
    const path of [
      "/articles",
      "/articles?view=list",
      "/articles/resilient-content-pipeline",
      "/#about",
    ]
  ) {
    await page.goto(path);
    if (info.project.name !== "no-javascript") {
      await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
    }
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        const root = document.documentElement;
        root.dataset.motion = "off";
        getComputedStyle(root).transitionDuration;
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
      }
      await expect(page.locator("main")).toBeVisible();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth + 1
      );
      expect(overflow, `${path} ${theme}`).toBe(false);
      if (info.project.name === "desktop") {
        const audit = await new AxeBuilder({ page }).include("main").analyze();
        expect(audit.violations).toEqual([]);
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), path)
      .toBe(false);
  }
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/articles");
  await expect(page.getByRole("link", { name: "リスト", exact: true })).toBeVisible();
});

test(
  "profile is centered and minimap retains ordinary heading navigation",
  async ({ page }, info) => {
    test.skip(info.project.name !== "desktop");
    await page.addInitScript(() => localStorage.setItem("lunacea-motion", "off"));
    await page.goto("/#about");
    const group = page.locator(".about-content");
    await expect(group.getByRole("link", { name: "記事を読む", exact: true })).toBeVisible();
    const centered = await group.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.abs(rect.x + rect.width / 2 - innerWidth / 2),
        y: Math.abs(rect.y + rect.height / 2 - innerHeight / 2),
      };
    });
    expect(centered.x).toBeLessThanOrEqual(1);
    expect(centered.y).toBeLessThanOrEqual(1);
    await page.goto("/articles/resilient-content-pipeline");
    const map = page.locator(".desktop-toc [data-composition-graph]");
    await expect(map).toHaveAttribute("aria-hidden", "true");
    expect(await map.locator("rect").count()).toBeGreaterThan(0);
    await expect(map.locator("path")).toHaveCount(0);
    await page.locator(".desktop-toc a").nth(1).click();
    await expect(page.locator(".desktop-toc a").nth(1)).toHaveAttribute("aria-current", "location");
    await page.goto("/articles?view=list");
    const record = page.locator(".article-collection a[data-content-list-record]").first();
    await record.focus();
    await expect(record).toBeFocused();
    await record.press("Enter");
    await expect(page).toHaveURL(/\/articles\/[^/]+$/);
  },
);

test("the corner peel immediately respects OS reduced motion", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "full"));
  await page.goto("/articles");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true");
  const fold = page.locator("main [data-paper-fold]").first();
  await expect(fold).toHaveCSS("scale", "none");
  await page.locator(".article-collection > li a").first().hover();
  await expect(fold).toHaveCSS("scale", "1.45");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(fold).toHaveCSS("scale", "1");
});
