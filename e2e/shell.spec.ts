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
  // The C of the wordmark is the sun-and-moon mark, decorative: the link still goes Home.
  await expect(header.locator("a .theme-glyph")).toHaveCount(1);
  await expect(header.locator("a button")).toHaveCount(0);
  // Both preference controls sit in the bar, and the footer keeps its own pair.
  await expect(header.locator(".header-theme button")).toBeVisible();
  await expect(header.locator(".header-display button")).toBeVisible();
  await expect(page.getByRole("contentinfo").locator(".settings-trigger")).toHaveCount(1);
  // The bar sits in the document flow, so it scrolls away and can never cover a target.
  const resting = await header.boundingBox();
  expect(resting?.y ?? -1).toBeLessThanOrEqual(1);
  await page.evaluate(() => scrollTo(0, 600));
  expect((await header.boundingBox())?.y ?? 0).toBeLessThan(resting?.y ?? 0);
  // Home replaces the bar with the masthead entirely.
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
  // A preference stored by an earlier release names a third mode the site no longer offers.
  await page.addInitScript(() => localStorage.setItem("lunacea-motion", "reduced"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off", HYDRATED);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  // On Home the lunar disc of the masthead is the theme control.
  const disc = page.locator("#home-title button");
  await expect(disc).toHaveAttribute("data-ready", "true", HYDRATED);
  await disc.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Motion is binary, so the control returns to OFF on the second press.
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
      names: [named("main"), named("header"), named(".index-list > li")],
      oldDuration: getComputedStyle(root, "::view-transition-old(root)").animationDuration,
      newDelay: getComputedStyle(root, "::view-transition-new(root)").animationDelay,
    };
  });
  // Nothing inside the page owns a transition name: the root snapshot is the whole page, so the
  // crossing is the same wherever the reader had scrolled to.
  expect(timing.names).toEqual(["none", "none", "none"]);
  // The incoming image starts before the outgoing one has finished, so the header and the footer
  // never drop out for a frame.
  const [duration, delay] = [timing.oldDuration, timing.newDelay].map(Number.parseFloat);
  expect(duration).toBeGreaterThan(0);
  expect(delay).toBeGreaterThan(0);
  expect(delay).toBeLessThan(duration);
});
