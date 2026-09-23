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
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator(".settings-trigger")).toHaveCount(1);
  expect(
    await page.evaluate(() => {
      const light = document.querySelector<HTMLElement>("[data-editorial-light]")!;
      const footer = document.querySelector<HTMLElement>("footer")!;
      return Number(getComputedStyle(light).zIndex) < Number(getComputedStyle(footer).zIndex);
    }),
  ).toBe(true);
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
  const allArticles = page.getByRole("link", { name: /All articles/i });
  await allArticles.hover();
  await expect.poll(() =>
    allArticles.evaluate((anchor) =>
      getComputedStyle(anchor.querySelector<HTMLElement>('[data-ink-label="fill"]')!).clipPath
    )
  ).toBe("inset(0px)");
  expect(
    await allArticles.evaluate((anchor) => {
      const base = anchor.querySelector<HTMLElement>('[data-ink-label="base"]')!;
      const fill = anchor.querySelector<HTMLElement>('[data-ink-label="fill"]')!;
      const inkProbe = document.createElement("span");
      const canvasProbe = document.createElement("span");
      inkProbe.style.color = "var(--color-foreground)";
      canvasProbe.style.color = "var(--color-background)";
      document.body.append(inkProbe, canvasProbe);
      const baseMatches = getComputedStyle(base).color === getComputedStyle(inkProbe).color;
      const fillMatches = getComputedStyle(fill).color === getComputedStyle(canvasProbe).color;
      const baseBox = base.getBoundingClientRect();
      const fillBox = fill.getBoundingClientRect();
      inkProbe.remove();
      canvasProbe.remove();
      return {
        baseMatches,
        fillMatches,
        aligned: Math.abs(baseBox.x - fillBox.x) < 0.01 &&
          Math.abs(baseBox.y - fillBox.y) < 0.01 &&
          Math.abs(baseBox.width - fillBox.width) < 0.01 &&
          Math.abs(baseBox.height - fillBox.height) < 0.01,
      };
    }),
  ).toEqual({ baseMatches: true, fillMatches: true, aligned: true });
  const display = page.getByRole("button", { name: /アニメーション:/ });
  await display.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(display).toHaveAttribute("aria-label", /アニメーション: ON/);
  const motionTransition = await display.evaluate((button) => {
    const style = getComputedStyle(button);
    return {
      properties: style.transitionProperty,
      duration: style.transitionDuration,
      timing: style.transitionTimingFunction,
    };
  });
  expect(motionTransition.properties).toContain("background-color");
  expect(motionTransition.duration).toBe("0.42s");
  expect(motionTransition.timing).toBe("cubic-bezier(0.7, 0, 0.3, 1)");
  const themeTransition = await disc.evaluate((button) => {
    button.click();
    const root = document.documentElement;
    return {
      active: root.dataset.themeTransition,
      properties: getComputedStyle(root).transitionProperty,
    };
  });
  expect(themeTransition).toEqual({ active: "active", properties: "none" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition", "active");
  await disc.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-transition", "active");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await disc.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await display.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.goto("/articles");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("button", { name: /アニメーション: OFF/ })).toHaveCount(2);
  const headerMotion = page.locator(".header-display").getByRole("button");
  await expect(headerMotion).toHaveAttribute("data-ready", "true", HYDRATED);
  await headerMotion.click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(page.getByRole("button", { name: /アニメーション: ON/ })).toHaveCount(2);
  await page.locator(".footer-display").getByRole("button").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("button", { name: /アニメーション: OFF/ })).toHaveCount(2);
});

test("history navigation and page transitions keep the shell intact", {
  tag: ["@desktop"],
}, async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/articles");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", HYDRATED);
  const light = page.locator("[data-editorial-light]");
  await expect(light).toHaveCount(1);
  await light.evaluate((node) => {
    (globalThis as typeof globalThis & { __weatherField?: Element }).__weatherField = node;
  });
  await page.getByRole("banner").getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.locator("html")).toHaveAttribute("data-page-enter", "active");
  await expect(page.locator(".route-content")).toHaveCSS("animation-name", "page-enter");
  expect(
    await light.evaluate((node) =>
      node === (globalThis as typeof globalThis & { __weatherField?: Element }).__weatherField
    ),
  ).toBe(true);
  await expect(page.locator("html")).not.toHaveAttribute("data-page-enter", "active");
  await page.getByRole("link", { name: /All articles/i }).click();
  await expect(page).toHaveURL(/\/articles$/u);
  expect(
    await light.evaluate((node) =>
      node === (globalThis as typeof globalThis & { __weatherField?: Element }).__weatherField
    ),
  ).toBe(true);
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
      scroller: named("main"),
      route: named(".route-content"),
      row: named(".index-list > li"),
      header: named("header"),
      weather: named("[data-editorial-light]"),
      root: getComputedStyle(root).viewTransitionName,
      headerBackdrop: getComputedStyle(root, "::view-transition-group(site-header)")
        .backdropFilter,
    };
  });
  expect(timing.scroller).toBe("none");
  expect(timing.route).toBe("none");
  expect(timing.row).toBe("none");
  expect(timing.header).toBe("site-header");
  expect(timing.weather).toBe("none");
  expect(timing.root).toBe("none");
  expect(timing.headerBackdrop).toBe("none");
  expect(pageErrors).toEqual([]);
});

test("returning from an article folds the paper into its row and leaves nothing named", {
  tag: ["@desktop"],
}, async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/articles");
  await expect(page.getByRole("banner")).toHaveAttribute("data-ready", "true", HYDRATED);
  const record = page.locator(".index-list h3 a").nth(1);
  const href = await record.getAttribute("href");
  await record.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`, "u"), { timeout: 20_000 });
  await expect(page.locator("html")).not.toHaveAttribute("data-page-enter", "active");
  await page.evaluate(() => {
    const seen = globalThis as typeof globalThis & { __foldedInto?: string };
    new MutationObserver((records) => {
      for (const { target } of records) {
        const row = target as HTMLElement;
        if (row.dataset.paperReturnRow) {
          seen.__foldedInto = row.querySelector("a")?.getAttribute("href") ?? "";
        }
      }
    }).observe(document.body, { subtree: true, attributeFilter: ["data-paper-return-row"] });
  });
  await page.locator(".article-back").click();
  await expect(page).toHaveURL(/\/articles$/u);
  await expect.poll(() =>
    page.evaluate(() => (globalThis as typeof globalThis & { __foldedInto?: string }).__foldedInto)
  ).toBe(href);
  await expect(page.locator("html")).not.toHaveAttribute("data-paper-return");
  await expect(page.locator("[data-paper-return-row]")).toHaveCount(0);
  expect(
    await page.locator(".index-list > li").nth(1).evaluate((row) =>
      getComputedStyle(row).viewTransitionName
    ),
  ).toBe("none");
  expect(pageErrors).toEqual([]);
});
