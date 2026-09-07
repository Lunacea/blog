import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ARTICLE, headerOverlap, horizontalOverflow, motionOff, SEARCH_TERM } from "./support.ts";

// One audit per surface archetype instead of per route: Home, a filtered catalog and an article
// between them render every component the site owns. The dark pass rides on the article because
// it carries the most themed surfaces, and contrast is the only theme-sensitive rule.
const AUDITS = [
  { route: "/", theme: "light" },
  { route: `/articles?q=${encodeURIComponent(SEARCH_TERM)}`, theme: "light" },
  { route: ARTICLE, theme: "light" },
  { route: ARTICLE, theme: "dark" },
  { route: "/this-page-does-not-exist", theme: "light" },
] as const;

for (const { route, theme } of AUDITS) {
  test(`${route} passes the ${theme} accessibility audit`, {
    tag: ["@desktop"],
  }, async ({ page }) => {
    // axe walks the whole document, which outlasts the default budget on a long article.
    test.setTimeout(120_000);
    // The pre-paint script reads both preferences, so the audited page never waits for hydration
    // to re-apply a theme, and motion off removes the colour transition that would otherwise be
    // sampled part-way and reported as contrast that never appears on screen.
    await page.addInitScript((theme) => {
      localStorage.setItem("lunacea-theme", theme);
      localStorage.setItem("lunacea-motion", "off");
    }, theme);
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("main")).toBeVisible();
    // A diagram arrives after its script; auditing before it lands would skip it at random.
    if (route === ARTICLE) {
      await expect(page.locator(".mermaid-diagram")).toBeVisible({ timeout: 15_000 });
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("narrow viewports and 200% text never scroll sideways", {
  tag: ["@desktop"],
}, async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(motionOff);
  for (const width of [320, 768]) {
    for (const route of ["/articles", ARTICLE]) {
      const where = `${route} @${width}`;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      // The measurement has to wait for the real faces: a fallback face is narrower, and reflow
      // measured against it reports room the reader never has.
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.documentElement.style.fontSize = "200%");
      await expect(page.locator("main")).toBeVisible();
      expect(await horizontalOverflow(page), where).toBeLessThanOrEqual(1);
      // Enlarged type must reflow around the bar rather than under it.
      expect(await headerOverlap(page, "main h1"), where).toBe(0);
    }
  }
});

test("the bar never covers the first content of a route", {
  tag: ["@desktop", "@mobile"],
}, async ({ page }) => {
  for (
    const [route, selector] of [
      ["/articles", "main h1"],
      [ARTICLE, ".article-header h1"],
    ] as const
  ) {
    await page.goto(route);
    expect(await headerOverlap(page, selector), route).toBe(0);
  }
});
