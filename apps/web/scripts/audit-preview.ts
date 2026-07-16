/// <reference lib="dom" />

import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseUrl = (Deno.env.get("PREVIEW_URL") ?? "http://127.0.0.1:4174").replace(/\/$/u, "");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lunacea-motion", "off");
    globalThis.__lunaceaAuditCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          globalThis.__lunaceaAuditCls += (entry as PerformanceEntry & { value: number }).value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 180,
    downloadThroughput: 256_000,
    uploadThroughput: 128_000,
  });
  const failedRequests: string[] = [];
  const fontResponses: Array<{ url: string; status: number }> = [];
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  page.on("response", (response) => {
    if (/\.woff2(?:$|\?)/u.test(response.url())) {
      fontResponses.push({ url: response.url(), status: response.status() });
    }
  });

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const cls = await page.evaluate(() => globalThis.__lunaceaAuditCls);
  const landmarkTags = await page.locator("header, nav, main, footer").evaluateAll((nodes) =>
    nodes.map((node) => node.tagName.toLowerCase())
  );
  const headingCount = await page.locator("h1").count();

  assert(cls <= .1, `Slow-network CLS exceeded 0.1: ${cls}`);
  assert(fontResponses.length >= 2, "Expected the two initial font preloads to be requested");
  assert(
    fontResponses.every((item) => new URL(item.url).origin === baseUrl && item.status === 200),
    "Fonts were not served successfully from the preview origin",
  );
  assert(failedRequests.length === 0, `Preview requests failed: ${failedRequests.join(", ")}`);
  for (const landmark of ["header", "nav", "main", "footer"]) {
    assert(landmarkTags.includes(landmark), `Missing ${landmark} landmark`);
  }
  assert(headingCount === 1, `Expected one Home h1, found ${headingCount}`);

  const crawler = await context.newPage();
  await crawler.setExtraHTTPHeaders({ "user-agent": "Twitterbot/1.0" });
  await crawler.goto(`${baseUrl}/articles/resilient-content-pipeline`, {
    waitUntil: "domcontentloaded",
  });
  const socialMeta = await crawler.evaluate(() =>
    Object.fromEntries(
      ["og:title", "og:url", "og:image", "twitter:card"].map((name) => [
        name,
        document.querySelector(`meta[property="${name}"],meta[name="${name}"]`)?.getAttribute(
          "content",
        ),
      ]),
    )
  );
  assert(socialMeta["og:title"], "Crawler response is missing og:title");
  assert(socialMeta["og:url"]?.endsWith("/articles/resilient-content-pipeline"), "Invalid og:url");
  assert(
    socialMeta["og:image"]?.endsWith("/og/article/resilient-content-pipeline.png"),
    "Invalid og:image",
  );
  assert(socialMeta["twitter:card"] === "summary_large_image", "Invalid Twitter card type");

  const ogResponse = await context.request.get(
    `${baseUrl}/og/article/resilient-content-pipeline.png`,
  );
  const ogMetadata = await sharp(await ogResponse.body()).metadata();
  assert(ogResponse.status() === 200, `OGP returned ${ogResponse.status()}`);
  assert(ogResponse.headers()["content-type"] === "image/png", "OGP is not a PNG");
  assert(ogMetadata.width === 1200 && ogMetadata.height === 630, "OGP is not 1200x630");

  const fallbackContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const fallbackPage = await fallbackContext.newPage();
    await fallbackPage.route(/\.woff2(?:$|\?)/u, (route) => route.abort());
    await fallbackPage.goto(`${baseUrl}/articles/resilient-content-pipeline`, {
      waitUntil: "networkidle",
    });
    const fallbackHeading = await fallbackPage.locator("h1").evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      text: element.textContent?.trim(),
    }));
    assert(fallbackHeading.height > 0 && fallbackHeading.text, "Font failure hid primary content");
  } finally {
    await fallbackContext.close();
  }

  console.log(
    `Preview audit passed: CLS ${
      cls.toFixed(4)
    }, ${fontResponses.length} same-origin font requests, ` +
      "landmarks, font fallback, crawler metadata, and 1200x630 OGP.",
  );
  await context.close();
} finally {
  await browser.close();
}

declare global {
  var __lunaceaAuditCls: number;
}
