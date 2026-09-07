import { expect, test } from "@playwright/test";
import { ARTICLE, CATALOG, MATH_ARTICLE, SEARCH_TERM } from "./support.ts";

test("the catalog filters, searches and clears through GET, and rows open by keyboard", {
  tag: ["@desktop", "@mobile"],
}, async ({ page }, info) => {
  await page.goto("/articles");
  const index = page.getByRole("list", CATALOG);
  const all = await index.locator("> li").count();
  expect(all).toBeGreaterThan(1);
  const clear = page.getByRole("link", { name: "Clear", exact: true });

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
  await page.getByRole("link", { name: /^#/ }).first().click();
  await expect(page).toHaveURL(/tag=/);
  await clear.click();
  await expect(page).not.toHaveURL(/category=|tag=/);
  await expect(index.locator("> li")).toHaveCount(all);

  // Search narrows the same index and says so when nothing matches.
  await page.getByRole("searchbox").fill("鱻鱻鱻鱻鱻鱻");
  await page.getByRole("button", { name: "記事を検索", exact: true }).click();
  await expect(page.getByText("条件に一致する記事はありません。", { exact: false })).toBeVisible();
  await clear.click();
  await expect(index.locator("> li")).toHaveCount(all);

  // A row is a heading link, so it opens from the keyboard alone.
  const record = index.locator("h3 a").first();
  await record.focus();
  await record.press("Enter");
  await expect(page).toHaveURL(/\/articles\/[^/]+$/);
});

test("catalog controls stay reachable by touch", { tag: ["@mobile"] }, async ({ page }) => {
  await page.goto("/articles");
  // Search and tags close the page instead of gating it, so they need no disclosure at all.
  const search = page.getByRole("searchbox");
  await search.focus();
  await expect(search).toBeFocused();
  const tag = page.getByRole("link", { name: /^#/ }).first();
  expect(await tag.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThanOrEqual(44);
  await tag.click();
  await expect(page).toHaveURL(/tag=/u);
});

test("reading, filtering and search work without JavaScript", {
  tag: ["@nojs"],
}, async ({ page }) => {
  await page.goto(ARTICLE);
  await expect(page.getByRole("heading", { level: 1, name: "ボタンの触り心地を決める4つの状態" }))
    .toBeVisible();
  await expect(page.getByRole("navigation", { name: "主要ナビゲーション" })).toBeVisible();
  // Every editorial block is server-rendered; only the diagram waits for a script.
  await expect(page.locator('.prose h2[id="focusは消さない"]')).toBeVisible();
  await expect(page.locator(".code-block code")).toBeVisible();
  await expect(page.locator(".annotation")).toBeVisible();
  await expect(page.locator(".link-card")).toBeVisible();
  await expect(page.locator(".mermaid-source")).toBeVisible();
  await expect(page.locator(".mermaid-diagram")).toHaveCount(0);
  // Maths is rendered at build time, so it needs no script either.
  await page.goto(MATH_ARTICLE);
  await expect(page.locator(".katex").first()).toBeVisible();

  // Category, tag and search are all one query string, so none of them needs a script.
  await page.goto("/articles");
  await page.getByRole("navigation", { name: "カテゴリ", exact: true }).getByRole("link").nth(1)
    .click();
  await expect(page).toHaveURL(/category=/);
  await expect(page.getByRole("list", CATALOG).locator("> li").first()).toBeVisible();
  await page.getByRole("searchbox").fill(SEARCH_TERM);
  await page.getByRole("button", { name: "記事を検索" }).click();
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(SEARCH_TERM)}`, "u"));
  await expect(page.getByRole("list", CATALOG).locator("> li").first()).toBeVisible();
});
