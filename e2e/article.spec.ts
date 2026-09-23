import { expect, test } from "@playwright/test";
import {
  ARTICLE,
  HYDRATED,
  motionOff,
  REACTION_ARTICLE,
  themeToggle,
  weatherReading,
} from "./support.ts";

test("the article is a sheet of paper and carries its reading tools on it", {
  tag: ["@desktop"],
}, async ({ page }) => {
  const requests: string[] = [];
  const rejected: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().includes("/api/")) {
      rejected.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  await page.route(
    "**/api/v1/weather?**",
    (route) => route.fulfill({ json: weatherReading("clear") }),
  );
  await page.goto(ARTICLE);

  await expect(page.getByRole("heading", { level: 1, name: "ボタンの触り心地を決める4つの状態" }))
    .toBeVisible();
  await expect(page.getByRole("progressbar", { name: "読了進捗" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "目次" })).toBeVisible();
  await expect(page.locator(".article-header .category-label")).toContainText("design");
  await expect(page.locator(".article-flags")).toContainText("更新中");
  await expect(page.locator(".article-dates")).toContainText("更新");
  await expect(page.locator(".status-badge")).toContainText("更新中");
  await expect(page.getByRole("heading", { name: "Related" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revisions" })).toBeVisible();
  await expect(page.locator('.related ol[aria-label="関連記事"] > li h3 a').first()).toBeVisible();
  await expect(page.getByText("この記録をどう感じましたか")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "#Design", exact: true }))
    .toHaveAttribute("href", "/articles?tag=Design");

  // 記事の面は紙そのもの。外の場はこの面の上下にだけ見える。
  await expect(page.locator(".reading-surface")).toHaveCSS("background-color", /^rgb\(/);
  await expect(page.locator(".mermaid-diagram")).toBeVisible({ timeout: 15_000 });
  const surfaces = await page.evaluate(() =>
    [".annotation", ".code-block", ".mermaid-diagram", ".link-card"].map((selector) =>
      getComputedStyle(document.querySelector(selector)!).backgroundColor
    )
  );
  for (const background of surfaces) expect(background).not.toBe("rgba(0, 0, 0, 0)");
  expect(
    await page.locator(".link-card").evaluate((card) => {
      const copy = card.querySelector(".copy");
      return copy ? copy.scrollHeight <= copy.clientHeight + 1 : false;
    }),
  ).toBe(true);

  // 記事も外の場を持つ。ただし本文は不透明な紙なので、場が見えるのは紙の上下だけ。
  await expect(page.locator("[data-editorial-light]")).toHaveAttribute("data-weather", "clear");
  await expect.poll(() => requests.filter((url) => /api\/v1\/weather/.test(url)).length).toBe(1);
  await expect(page.locator(".reading-surface")).toHaveCSS("background-color", /rgb\(/);
  await expect.poll(() => requests.some((url) => url.includes("/api/v1/impressions/"))).toBe(true);
  expect(rejected).toEqual([]);
});

test("the desktop table of contents tracks the reading position", {
  tag: ["@desktop"],
}, async ({ page }) => {
  await page.goto(ARTICLE);
  const toc = page.locator(".desktop-toc");
  await expect(toc).toHaveAttribute("data-ready", "true", HYDRATED);
  await expect(page.locator(".mobile-toc-region")).toBeHidden();
  const map = toc.locator("[data-composition-graph]");
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("aria-hidden", "true");
  expect(await map.locator("rect").count()).toBeGreaterThan(0);
  const rows = await toc.locator(".toc-list > li").evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().height)
  );
  expect(Math.min(...rows)).toBeGreaterThanOrEqual(32);

  const link = toc.locator('a[href="#focusは消さない"]');
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "location");
  await expect(page.locator("#focusは消さない")).toBeInViewport();
  const marker = await toc.locator(".toc-list").evaluate((list) => {
    const row = list.querySelector('a[aria-current="location"]')
      ?.closest<HTMLElement>("li");
    const top = Math.max(0, (row?.offsetTop ?? 0) - 2);
    const bottom = Math.min(
      (list as HTMLElement).offsetHeight,
      (row?.offsetTop ?? 0) + (row?.offsetHeight ?? 0) + 2,
    );
    return {
      expectedTop: top,
      expectedHeight: bottom - top,
      actualTop: Number.parseFloat((list as HTMLElement).style.getPropertyValue("--toc-marker-y")),
      actualHeight: Number.parseFloat(
        (list as HTMLElement).style.getPropertyValue("--toc-marker-height"),
      ),
    };
  });
  expect(marker.actualTop).toBeCloseTo(marker.expectedTop, 1);
  expect(marker.actualHeight).toBeCloseTo(marker.expectedHeight, 1);

  const trackColour = () =>
    toc.locator(".toc-list").evaluate((list) => getComputedStyle(list, "::after").backgroundColor);
  const light = await trackColour();
  await (await themeToggle(page)).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(trackColour).not.toBe(light);
});

test("the mobile table of contents is a disclosure", { tag: ["@mobile"] }, async ({ page }) => {
  await page.goto(ARTICLE);
  await expect(page.locator(".desktop-toc")).toBeHidden();
  await expect(page.locator(".mobile-toc-region")).toHaveAttribute("data-ready", "true", HYDRATED);
  const trigger = page.locator(".mobile-toc-js .mobile-toc-trigger");
  await expect(trigger).toContainText("目次");
  await expect(trigger).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const rules = trigger.locator(".index-glyph path");
  await expect(rules).toHaveCount(3);
  const width = (index: number) =>
    rules.nth(index).evaluate((rule) => rule.getBoundingClientRect().width);
  const folded = await width(1);

  await trigger.click();
  await expect(trigger).toHaveAttribute("data-state", "open");
  await expect(page.locator(".mobile-toc-content")).toHaveAttribute("data-state", "open");
  await expect(rules.first()).toHaveCSS("opacity", "0");
  await expect.poll(() => width(1)).toBeGreaterThan(folded);
  await trigger.click();
  await expect(page.locator(".mobile-toc-content")).toHaveAttribute("data-state", "closed");
});

test("code and diagram blocks pair a rendered view with an editable source", {
  tag: ["@desktop"],
}, async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(motionOff);
  await page.goto(ARTICLE);

  const block = page.locator(".code-block").first();
  await expect(block.getByRole("tab", { name: "Preview" }))
    .toHaveAttribute("aria-selected", "true", HYDRATED);
  await expect(block.getByRole("button", { name: "Reset" })).toBeHidden();
  const copy = block.getByRole("button", { name: /をコピー/u });
  await expect(copy).not.toHaveAttribute("title");
  const inBar = await copy.evaluate((button) => {
    const owner = button.closest<HTMLElement>(".code-block")!;
    const bar = owner.firstElementChild as HTMLElement;
    const box = button.getBoundingClientRect();
    return {
      inBar: bar.contains(button),
      clearOfCode: box.bottom <=
        owner.querySelector(".block-preview")!.getBoundingClientRect().top + 1,
      height: box.height,
      control: Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--control-size"),
      ) * 16,
    };
  });
  expect(inBar.inBar).toBe(true);
  expect(inBar.clearOfCode).toBe(true);
  expect(inBar.height).toBeGreaterThanOrEqual(inBar.control - 1);

  const bar = block.locator("> div").first();
  await expect(bar.locator("> *").first()).toHaveText("button.css");
  await expect(bar.locator("> *")).toHaveCount(2);
  expect(await block.evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none");

  await block.getByRole("tab", { name: "Source" }).click();
  const editor = block.locator("textarea");
  const authored = await editor.inputValue();
  expect(authored.length).toBeGreaterThan(0);
  await editor.fill(`${authored}\n// tried`);
  const reset = block.getByRole("button", { name: "Reset" });
  await expect(reset).toBeVisible();
  await copy.click();
  await expect(copy.locator("svg")).toHaveAttribute("data-glyph", "copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("// tried");
  await block.getByRole("tab", { name: "Preview" }).click();
  await expect(block.locator("pre[aria-label$='（編集中）']")).toBeVisible();
  await block.getByRole("tab", { name: "Source" }).click();
  await reset.click();
  await expect(reset).toBeHidden();
  expect(await editor.inputValue()).toBe(authored);

  const diagram = page.locator(".diagram-block").first();
  const drawing = diagram.locator(".mermaid-diagram svg");
  await expect(drawing).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".mermaid-source")).toBeHidden();
  const geometry = await drawing.evaluate((svg: SVGSVGElement) => ({
    width: svg.getBoundingClientRect().width,
    height: svg.getBoundingClientRect().height,
    ratio: svg.viewBox.baseVal.width / svg.viewBox.baseVal.height,
    animation: getComputedStyle(svg).animationName,
  }));
  expect(geometry.width).toBeGreaterThan(300);
  expect(geometry.height).toBeGreaterThan(40);
  expect(geometry.height).toBeLessThan(160);
  expect(geometry.ratio).toBeGreaterThan(5);
  expect(geometry.animation).toBe("none");
  const lightDrawing = await drawing.getAttribute("id");
  await (await themeToggle(page)).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => drawing.getAttribute("id")).not.toBe(lightDrawing);
  // 戻すときは描き直さず、控えておいた図へ差し替える。
  await (await themeToggle(page)).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => drawing.getAttribute("id")).toBe(lightDrawing);

  // 拡大は図そのものをモーダルへ移し、閉じると元の場所とフォーカスへ戻す。
  const expand = diagram.getByRole("button", { name: /を拡大$/u });
  await expand.click();
  const zoom = page.getByRole("dialog", { name: "ボタンの状態遷移" });
  await expect(zoom.locator(".mermaid-diagram svg")).toBeVisible();
  await expect(drawing).toHaveCount(0);
  // 開いている間は背後の記事が動かない。
  const resting = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(resting);
  await page.keyboard.press("Escape");
  await expect(zoom).toBeHidden();
  await expect(drawing).toBeVisible();
  await expect(expand).toBeFocused();

  await diagram.getByRole("tab", { name: "Source" }).click();
  await diagram.locator("textarea").fill("graph LR\n  A[Alpha] --> B[Beta]");
  await diagram.getByRole("tab", { name: "Diagram" }).click();
  await expect(diagram.locator(".mermaid-diagram")).toContainText("Alpha", { timeout: 15_000 });
  await diagram.getByRole("tab", { name: "Source" }).click();
  await diagram.getByRole("button", { name: "Reset" }).click();
  await diagram.getByRole("tab", { name: "Diagram" }).click();
  await expect(diagram.locator(".mermaid-diagram")).not.toContainText("Alpha", { timeout: 15_000 });
});

test("anonymous praise and share stay available", { tag: ["@desktop"] }, async ({ page }) => {
  await page.goto(REACTION_ARTICLE);
  const praise = page.locator("button.praise");
  await expect(praise).toHaveAccessibleName("称賛する");
  // 開発時の初回リクエストはルートのコンパイルと KV 初期化を含むことがある。
  await expect(praise).toBeEnabled(HYDRATED);
  const idle = await praise.evaluate((element) => getComputedStyle(element).backgroundColor);
  await praise.hover();
  expect((await praise.locator(".heart-glyph").boundingBox())?.width ?? 0).toBeGreaterThan(32);
  await expect(praise.locator(".heart-glyph")).toHaveCSS("transition-property", /scale/);

  const celebration = praise.locator("span[data-celebrating]");
  const animationStarted = celebration.evaluate((element) =>
    new Promise<string>((resolve) => {
      const read = () => {
        if (element.dataset.celebrating !== "true") return false;
        resolve(getComputedStyle(element).animationName);
        return true;
      };
      if (read()) return;
      const observer = new MutationObserver(() => {
        if (!read()) return;
        observer.disconnect();
      });
      observer.observe(element, { attributes: true, attributeFilter: ["data-celebrating"] });
    })
  );
  await praise.click();
  expect(await animationStarted).toMatch(/praise-liquid/u);
  expect((await celebration.boundingBox())?.width ?? 999).toBeLessThan(120);
  await expect(praise).toHaveAttribute("aria-pressed", "true");
  await expect(praise).toHaveCSS("background-color", idle);
  await expect(praise.locator(".heart-glyph")).toHaveAttribute("data-filled", "true");
  await expect(celebration).toHaveAttribute("data-celebrating", "false", { timeout: 5_000 });

  await page.reload();
  await expect(page.getByRole("button", { name: "称賛を取り消す" }))
    .toHaveAttribute("aria-pressed", "true", HYDRATED);
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  const share = page.getByRole("button", { name: "Share" });
  const fill = await share.evaluate((button) => {
    const style = getComputedStyle(button, "::before");
    return {
      originY: Number.parseFloat(style.transformOrigin.split(" ")[1]),
      scale: style.scale,
      height: button.getBoundingClientRect().height,
    };
  });
  expect(fill.height - fill.originY).toBeLessThanOrEqual(2.1);
  expect(fill.scale).toBe("1 0");
  await share.hover();
  await expect.poll(() => share.evaluate((button) => getComputedStyle(button, "::before").scale))
    .toBe("1");
  await expect(page.getByRole("link", { name: "Post" }))
    .toHaveAttribute("href", /x\.com\/intent\/post/u);
  await expect(page.getByRole("link", { name: "Bluesky" })).toHaveCount(0);
});
