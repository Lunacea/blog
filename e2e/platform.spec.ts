import { expect, test } from "@playwright/test";
import { ARTICLE, SEARCH_TERM } from "./support.ts";

// These read the HTTP boundary only, so they need no browser page.
test("the public surface responds and filtered catalogs declare their policy", {
  tag: ["@desktop"],
}, async ({ page, request }) => {
  // The OG images are rasterised on first request, which a cold dev server does slowly.
  test.setTimeout(120_000);
  for (
    const route of [
      "/",
      "/articles",
      ARTICLE,
      "/rss.xml",
      "/atom.xml",
      "/sitemap.xml",
      "/api/v1/health",
    ]
  ) expect((await request.get(route)).ok(), route).toBe(true);
  // A feed or a sitemap that answers but carries no record is the same as a missing one: every
  // published article has to appear in all three.
  const published = [...(await (await request.get("/sitemap.xml")).text()).matchAll(
    /<loc>[^<]*\/articles\/([^<]+)<\/loc>/gu,
  )].map(([, slug]) => slug);
  expect(published.length).toBeGreaterThan(0);
  for (const [route, item] of [["/rss.xml", "item"], ["/atom.xml", "entry"]] as const) {
    const feed = await (await request.get(route)).text();
    expect([...feed.matchAll(new RegExp(`<${item}>`, "gu"))].length, route)
      .toBe(published.length);
  }
  for (const route of ["/og/site.png", `/og/article${ARTICLE.replace("/articles", "")}.png`]) {
    const response = await request.get(route);
    expect(response.ok(), route).toBe(true);
    expect(response.headers()["content-type"], route).toBe("image/png");
  }
  // A filtered view is one of many, so it caches at the edge and points crawlers at the catalog.
  const filtered = await page.goto(`/articles?q=${encodeURIComponent(SEARCH_TERM)}&sort=relevance`);
  expect(filtered?.headers()["cache-control"]).toBe(
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/articles$/u);
  await expect(page.locator('meta[name="robots"][content="noindex,follow"]')).toHaveCount(1);
});

test("retired routes are gone, legacy URLs redirect once, and a miss still reads", {
  tag: ["@desktop"],
}, async ({ page, request }) => {
  for (
    const route of [
      "/works",
      "/works/quiet-archive",
      "/archive",
      "/archive/photos",
      "/archive/photos/after-rain",
      "/og/work/quiet-archive.png",
      "/og/photo/after-rain.png",
      "/tags/Design",
    ]
  ) expect((await request.get(route)).status(), route).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toMatch(/\/works|\/archive/);

  for (
    const [from, to] of [
      ["/about", "/#about"],
      ["/about?ref=legacy", "/?ref=legacy#about"],
      [
        "/search?q=天候&tag=Deno&category=engineering&sort=updated&view=grid",
        "/articles?q=%E5%A4%A9%E5%80%99&tag=Deno&category=engineering&sort=updated&view=list",
      ],
    ]
  ) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers().location, from).toBe(to);
  }

  // A missing record still arrives as a readable page rather than a bare status.
  expect((await page.goto("/this-page-does-not-exist"))?.status()).toBe(404);
  // The page says what happened in plain words, not only with a status code.
  await expect(page.getByRole("heading", { level: 1, name: "このページはありません" }))
    .toBeVisible();
  await expect(page.getByRole("link", { name: "記事の一覧へ" })).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
});
