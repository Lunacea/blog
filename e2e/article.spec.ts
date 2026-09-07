import { expect, test } from "@playwright/test";
import { ARTICLE, HYDRATED, motionOff, REACTION_ARTICLE, themeToggle } from "./support.ts";

test("the article carries its reading tools on opaque surfaces and never opens WebGL", {
  tag: ["@desktop"],
}, async ({ page }) => {
  const requests: string[] = [];
  const rejected: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  // The impression is fire-and-forget, so a rejected write is invisible on the page itself.
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().includes("/api/")) {
      rejected.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  await page.goto(ARTICLE);

  await expect(page.getByRole("heading", { level: 1, name: "ボタンの触り心地を決める4つの状態" }))
    .toBeVisible();
  await expect(page.getByRole("progressbar", { name: "読了進捗" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "目次" })).toBeVisible();
  await expect(page.locator(".article-header .category-label")).toContainText("design");
  await expect(page.locator(".article-flags")).toContainText("更新中");
  await expect(page.locator(".article-dates")).toContainText("更新");
  await expect(page.locator(".status-badge")).toContainText("更新中");
  await expect(page.getByRole("heading", { name: "関連記事" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "更新履歴" })).toBeVisible();
  await expect(page.locator('.related ol[aria-label="関連記事"] > li h3 a').first()).toBeVisible();
  // The reaction prompt was retired; praise is the only invitation left.
  await expect(page.getByText("この記録をどう感じましたか")).toHaveCount(0);
  // Tag pages are retired too, so a detail label targets the filtered catalog instead.
  await expect(page.getByRole("link", { name: "#Design", exact: true }))
    .toHaveAttribute("href", "/articles?tag=Design");

  // The reading column is the page's own paper, and every block on it stays opaque so the field
  // behind can never bleed into text.
  await expect(page.locator(".reading-surface")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".mermaid-diagram")).toBeVisible({ timeout: 15_000 });
  const surfaces = await page.evaluate(() =>
    [".annotation", ".code-block", ".mermaid-diagram", ".link-card"].map((selector) =>
      getComputedStyle(document.querySelector(selector)!).backgroundColor
    )
  );
  for (const background of surfaces) expect(background).not.toBe("rgba(0, 0, 0, 0)");
  // A link card has to hold its whole summary rather than clipping it.
  expect(
    await page.locator(".link-card").evaluate((card) => {
      const copy = card.querySelector(".copy");
      return copy ? copy.scrollHeight <= copy.clientHeight + 1 : false;
    }),
  ).toBe(true);

  // Reading routes keep the static field only: no weather reading, no renderer, no canvas.
  expect(requests.filter((url) => /api\/v1\/weather|editorial-light|three\.js/.test(url)))
    .toEqual([]);
  await expect(page.locator("[data-editorial-light]")).not.toHaveAttribute("data-webgl", "true");
  await expect(page.locator("canvas")).toHaveCount(0);
  // Reading an article records one anonymous impression; the API has to accept it.
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
  // The minimap beside the list is decoration: it is drawn, and it is never announced.
  const map = toc.locator("[data-composition-graph]");
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("aria-hidden", "true");
  expect(await map.locator("rect").count()).toBeGreaterThan(0);
  // Rows stay large enough to hit even though the type is small.
  const rows = await toc.locator(".toc-list > li").evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().height)
  );
  expect(Math.min(...rows)).toBeGreaterThanOrEqual(32);

  const link = toc.locator('a[href="#focusは消さない"]');
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "location");
  await expect(page.locator("#focusは消さない")).toBeInViewport();
  // The marker is placed from the current row, so the two can never drift apart.
  const marker = await toc.locator(".toc-list").evaluate((list) => ({
    expected: list.querySelector('a[aria-current="location"]')
      ?.closest<HTMLElement>("li")?.offsetTop ?? -1,
    actual: Number.parseFloat(list.style.getPropertyValue("--toc-marker-y")),
  }));
  expect(marker.actual).toBeCloseTo(marker.expected, 1);

  // Track and marker are drawn from theme tokens, so they have to repaint with the theme.
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
  // The three index rules collapse into the single full-width rule while the list is open.
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
  // Copying belongs to the block's own bar, not to a square floating over the code.
  const copy = block.getByRole("button", { name: /Copy|Copied/ });
  await expect(copy).not.toHaveAttribute("title");
  const inBar = await copy.evaluate((button) => {
    const owner = button.closest<HTMLElement>(".code-block")!;
    const box = button.getBoundingClientRect();
    return {
      offset: box.top - owner.getBoundingClientRect().top -
        Number.parseFloat(getComputedStyle(owner).borderTopWidth),
      height: box.height,
      control: Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--control-size"),
      ) * 16,
    };
  });
  expect(inBar.offset).toBeLessThan(1);
  expect(inBar.height).toBeGreaterThanOrEqual(inBar.control - 1);

  await block.getByRole("tab", { name: "Source" }).click();
  const editor = block.locator("textarea");
  const authored = await editor.inputValue();
  expect(authored.length).toBeGreaterThan(0);
  await editor.fill(`${authored}\n// tried`);
  const reset = block.getByRole("button", { name: "Reset" });
  await expect(reset).toBeVisible();
  // Copy takes what the reader typed, and so does the rendered view.
  await copy.click();
  await expect(copy).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("// tried");
  await block.getByRole("tab", { name: "Preview" }).click();
  await expect(block.locator("pre[aria-label$='（編集中）']")).toBeVisible();
  await block.getByRole("tab", { name: "Source" }).click();
  await reset.click();
  await expect(reset).toBeHidden();
  expect(await editor.inputValue()).toBe(authored);

  // A diagram is the same pairing, and its rendered view replaces the source it was authored as.
  const diagram = page.locator(".diagram-block").first();
  const drawing = diagram.locator(".mermaid-diagram svg");
  await expect(drawing).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".mermaid-source")).toBeHidden();
  // Motion is off, and the authored aspect ratio survives: a wide flow never arrives as a column.
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
  // It is rasterised per theme, so switching has to produce a new drawing.
  const lightDrawing = await drawing.getAttribute("id");
  await (await themeToggle(page)).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => drawing.getAttribute("id")).not.toBe(lightDrawing);

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
  // The first development request may include route compilation while the API initializes KV.
  await expect(praise).toBeEnabled(HYDRATED);
  const idle = await praise.evaluate((element) => getComputedStyle(element).backgroundColor);
  await praise.hover();
  expect((await praise.locator(".heart-glyph").boundingBox())?.width ?? 0).toBeGreaterThan(32);
  // Hover scales the heart through a transition rather than a permanent animation.
  await expect(praise.locator(".heart-glyph")).toHaveCSS("transition-property", /scale/);

  await praise.click();
  await expect(praise).toHaveAttribute("aria-pressed", "true");
  // The control never changes colour; the filled glyph carries the selection.
  await expect(praise).toHaveCSS("background-color", idle);
  await expect(praise.locator(".heart-glyph")).toHaveAttribute("data-filled", "true");
  // The acknowledgement is one ring around the control: it never covers the page, and it goes.
  const celebration = page.locator("[data-praise-celebration]");
  await expect(celebration).toHaveCSS("animation-name", /praise-liquid/u);
  expect((await celebration.boundingBox())?.width ?? 999).toBeLessThan(120);
  await expect(celebration).toHaveCount(0, { timeout: 5_000 });

  await page.reload();
  // The stored selection arrives with the first reaction read, not with the document.
  await expect(page.getByRole("button", { name: "称賛を取り消す" }))
    .toHaveAttribute("aria-pressed", "true", HYDRATED);
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Post" }))
    .toHaveAttribute("href", /x\.com\/intent\/post/u);
  await expect(page.getByRole("link", { name: "Bluesky" })).toHaveCount(0);
});
