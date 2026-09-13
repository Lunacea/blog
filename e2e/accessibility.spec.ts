import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ARTICLE, headerOverlap, horizontalOverflow, motionOff, SEARCH_TERM } from "./support.ts";

// ルートごとではなく面の原型ごとに1回監査する。ホーム・絞り込み一覧・記事で全コンポーネントを覆う。
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
    // axe は文書全体を走査するため、長い記事では既定のタイムアウトを超える。
    test.setTimeout(120_000);
    // 色の遷移途中をサンプリングして実在しないコントラスト違反が出るのを防ぐためモーションを切る。
    await page.addInitScript((theme) => {
      localStorage.setItem("lunacea-theme", theme);
      localStorage.setItem("lunacea-motion", "off");
    }, theme);
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("main")).toBeVisible();
    // 図はスクリプト後に現れるため、到着を待たないと監査対象から漏れる。
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
      // 代替フォントは幅が狭く実際にない余地を報告するため、実フォント読み込みを待つ。
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.documentElement.style.fontSize = "200%");
      await expect(page.locator("main")).toBeVisible();
      expect(await horizontalOverflow(page), where).toBeLessThanOrEqual(1);
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
