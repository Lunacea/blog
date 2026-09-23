import { expect, test } from "@playwright/test";
import { HYDRATED } from "./support.ts";

test("the hairline bar carries the wordmark, the navigation and both controls", {
  tag: ["@desktop"],
}, async ({ page }) => {
  await page.goto("/articles");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: /^lunacea$/i })).toBeVisible();
  const navigation = header.getByRole("navigation", { name: "主要ナビゲーション" });
  await expect(navigation.getByRole("link")).toHaveText(["Home", "Articles"]);
  await expect(navigation.getByRole("link").nth(1)).toHaveAttribute("aria-current", "page");
  await expect(header.locator("a .theme-glyph")).toHaveCount(1);
  await expect(header.locator("a button")).toHaveCount(0);
  await expect(header.locator(".header-theme button")).toBeVisible();
  await expect(header.locator(".header-display button")).toBeVisible();
  await expect(page.getByRole("contentinfo").locator(".settings-trigger")).toHaveCount(1);
  expect((await header.boundingBox())?.y ?? -1).toBeLessThanOrEqual(1);
  await page.evaluate(() => scrollTo(0, 600));
  expect((await header.boundingBox())?.y ?? -1).toBeLessThanOrEqual(1);
  const clearance = await page.evaluate(() => {
    const bar = document.querySelector("header")!.getBoundingClientRect().height;
    return Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) - bar;
  });
  expect(clearance).toBeGreaterThanOrEqual(0);
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveCount(0);
});

test("the bar stays usable and tappable on mobile", { tag: ["@mobile"] }, async ({ page }) => {
  await page.goto("/articles");
  const links = page.getByRole("banner")
    .getByRole("navigation", { name: "主要ナビゲーション" }).getByRole("link");
  await expect(links).toHaveText(["Home", "Articles"]);
  const heights = await links.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().height)
  );
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  await links.first().click();
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.locator("#home-title")).toBeVisible();
});

test("theme and motion answer the keyboard, cycle and survive navigation", {
  tag: ["@desktop"],
}, async ({ page }) => {
  // 旧リリースが保存した、現在は存在しない第三のモードの値を想定する。
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "reduced"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off", HYDRATED);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  const disc = page.locator("#home-title button");
  await expect(disc).toHaveAttribute("data-ready", "true", HYDRATED);
  await disc.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const display = page.getByRole("button", { name: /アニメーション:/ });
  await display.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(display).toHaveAttribute("aria-label", /アニメーション: ON/);
  await display.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
});

test("history navigation and page transitions keep the shell intact", {
  tag: ["@desktop"],
}, async ({ page }) => {
  await page.goto("/articles");
  await page.goto("/articles?view=list");
  await page.goBack();
  await expect(page).toHaveURL(/\/articles$/u);
  await expect(page.locator("main")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/articles\?view=list$/u);
  await expect(page.locator("main")).toBeVisible();

  const timing = await page.evaluate(() => {
    const root = document.documentElement;
    const named = (selector: string) =>
      getComputedStyle(document.querySelector(selector)!).viewTransitionName;
    return {
      // スクロールする器に名前を付けると、遷移グループが自分のボックスを動かして
      // 長いページから出るとき旧画像が画面を縦断する。ここは名前を持たない。
      scroller: named("main"),
      row: named(".index-list > li"),
      // ヘッダは出入りを上下で示すので自分のグループを持つ。
      header: named("header"),
      // 地（天候の場）は前後で連続しているので旧画像は動かさない。
      // 薄くすると重なりのアルファが 1 を割り、地が透けて明暗の谷ができる。
      oldDuration: getComputedStyle(root, "::view-transition-old(root)").animationName,
      newDuration: getComputedStyle(root, "::view-transition-new(root)").animationDuration,
    };
  });
  expect(timing.scroller).toBe("none");
  expect(timing.row).toBe("none");
  expect(timing.header).toBe("site-header");
  expect(timing.oldDuration).toBe("none");
  expect(Number.parseFloat(timing.newDuration)).toBeGreaterThan(0);
});
