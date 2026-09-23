/// <reference lib="dom" />

import { AxeBuilder } from "@axe-core/playwright";
import { chromium, type ConsoleMessage, type Page } from "playwright";

const browserHeadless = Deno.env.get("STORYBOOK_HEADED") !== "true";

const outputDirectory = new URL("../storybook-static/", import.meta.url);
const requiredGroups = [
  "Components/",
  "Foundations/",
  "Motion/",
  "Patterns/",
  "Primitives/",
  "Visuals/",
];
const pageLevelAxeRules = ["landmark-one-main", "page-has-heading-one", "region"];

type StoryEntry = {
  id: string;
  name: string;
  title: string;
  type: "story" | string;
};

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function extension(pathname: string): string {
  const index = pathname.lastIndexOf(".");
  return index === -1 ? "" : pathname.slice(index);
}

async function analyzeAccessibility(page: Page) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).disableRules(pageLevelAxeRules).analyze();
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Axe is already running")) {
        throw error;
      }
      await page.waitForTimeout(100);
    }
  }
  throw new Error("Storybook accessibility analysis did not become idle");
}

async function serveStatic(request: Request): Promise<Response> {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  if (pathname === "/favicon.ico") return new Response(null, { status: 204 });
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  if (relativePath.split("/").includes("..")) return new Response("Bad request", { status: 400 });

  try {
    const body = await Deno.readFile(new URL(relativePath, outputDirectory));
    return new Response(body, {
      headers: {
        "content-type": contentTypes[extension(relativePath)] ?? "application/octet-stream",
      },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return new Response("Not found", { status: 404 });
    throw error;
  }
}

async function assertStory(
  page: Page,
  baseUrl: string,
  story: StoryEntry,
): Promise<void> {
  const runtimeErrors: string[] = [];
  const onPageError = (error: Error) => runtimeErrors.push(error.message);
  const onConsole = (message: ConsoleMessage) => {
    const browserDriverWarning = message.type() === "warning" &&
      /GL Driver Message.*GPU stall due to ReadPixels/.test(message.text());
    if (["error", "warning"].includes(message.type()) && !browserDriverWarning) {
      const location = message.location();
      const source = location.url ? ` (${location.url}:${location.lineNumber})` : "";
      runtimeErrors.push(`${message.text()}${source}`);
    }
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  try {
    const response = await page.goto(`${baseUrl}/iframe.html?id=${story.id}&viewMode=story`, {
      waitUntil: "networkidle",
    });
    if (!response?.ok()) throw new Error(`${story.id}: HTTP ${response?.status() ?? "unknown"}`);
    if (!(await page.locator("#storybook-root > *").count())) {
      throw new Error(`${story.id}: empty body`);
    }
    if (runtimeErrors.length) throw new Error(`${story.id}: ${runtimeErrors.join(" | ")}`);

    const accessibility = await analyzeAccessibility(page);
    if (accessibility.violations.length) {
      throw new Error(
        `${story.id}: axe violations ${accessibility.violations.map((item) => item.id).join(", ")}`,
      );
    }

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) throw new Error(`${story.id}: horizontal overflow ${overflow}px`);
  } finally {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
  }
}

async function openStory(page: Page, baseUrl: string, id: string) {
  await page.goto(`${baseUrl}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "networkidle" });
}

async function checkResponsiveContexts(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  stories: StoryEntry[],
) {
  const contexts: Array<{ name: string; width: number; height: number }> = [
    { name: "narrow mobile", width: 320, height: 720 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 900 },
    { name: "wide desktop", width: 1600, height: 1000 },
  ];

  for (const { name, width, height } of contexts) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    for (const story of stories) {
      await page.goto(`${baseUrl}/iframe.html?id=${story.id}&viewMode=story`, {
        waitUntil: "load",
      });
      await page.locator("#storybook-root > *").first().waitFor({ state: "attached" });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 1) {
        throw new Error(`${story.id} at ${name}: horizontal overflow ${overflow}px`);
      }
    }
    await context.close();
  }
}

async function checkIncreasedText(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  stories: StoryEntry[],
) {
  const failures: string[] = [];
  for (const viewport of [{ width: 320, height: 720 }, { width: 768, height: 1024 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const story of stories) {
      await openStory(page, baseUrl, story.id);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await page.waitForTimeout(50);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 1) {
        failures.push(`${story.id} at ${viewport.width}px/200% text: ${overflow}px`);
      }
    }
    await context.close();
  }
  if (failures.length) {
    throw new Error(`200% text horizontal overflow:\n${failures.join("\n")}`);
  }
}

async function checkHeaderKeyboard(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  await openStory(page, baseUrl, "components-siteheader--mobile");

  const banner = page.getByRole("banner");
  if (!await banner.getByRole("link", { name: /^lunacea$/iu }).count()) {
    throw new Error("SiteHeader has no wordmark link home");
  }
  const navigation = banner.getByRole("navigation", { name: "主要ナビゲーション" });
  const links = await navigation.getByRole("link").allTextContents();
  if (links.join(",") !== "Home,Articles") {
    throw new Error(`SiteHeader navigation is not Home, Articles: ${links.join(", ")}`);
  }
  if (
    await navigation.getByRole("link", { name: "Articles" }).getAttribute("aria-current") !== "page"
  ) {
    throw new Error("SiteHeader does not mark the current route");
  }

  const theme = banner.locator(".header-theme button");
  const display = banner.locator(".header-display button");
  if (!await theme.count() || !await display.count()) {
    throw new Error("SiteHeader is missing a preference control");
  }
  if (!await page.getByRole("button", { name: /テーマに切り替える/u }).count()) {
    throw new Error("SiteHeader has no accessible Theme control");
  }
  await theme.focus();
  if (!await theme.evaluate((element) => element === document.activeElement)) {
    throw new Error("SiteHeader theme control does not take focus");
  }
  const before = await page.evaluate(() => document.documentElement.dataset.theme ?? "");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    (previous) => (document.documentElement.dataset.theme ?? "") !== previous,
    before,
  );

  await page.evaluate(() => scrollTo(0, 600));
  if (Math.round((await banner.boundingBox())?.y ?? -1) > 1) {
    throw new Error("SiteHeader does not stay at the top of the viewport");
  }
  await context.close();
}

async function checkHomePatternInteractions(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await openStory(page, baseUrl, "patterns-profilecard--default");
  const card = page.locator(".profile-card");
  const links = card.getByRole("navigation", { name: "連絡先" }).getByRole("link");
  if (await links.count() !== 3) {
    throw new Error("ProfileCard does not expose the three configured contact links");
  }
  // 連絡先の上で始まった押下はカードのドラッグではない。
  const linkBox = await links.first().boundingBox();
  if (!linkBox) throw new Error("ProfileCard contact link has no hit area");
  await page.mouse.move(linkBox.x + linkBox.width / 2, linkBox.y + linkBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(linkBox.x + linkBox.width / 2 + 40, linkBox.y + linkBox.height / 2);
  await page.mouse.up();
  if (await card.getAttribute("data-held") === "true") {
    throw new Error("ProfileCard contact link incorrectly took hold of the card");
  }

  await context.close();
}

async function checkEditorialRendering(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  const page = await context.newPage();
  await openStory(page, baseUrl, "patterns-editorial-reading-surface--complete-document");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.locator(".mermaid-diagram svg").waitFor({ timeout: 10_000 });
  const requiredSelectors = [
    ".prose blockquote",
    ".prose .annotation",
    ".code-block .highlighted",
    ".katex",
    ".katex-display",
    'aside[aria-label="目次"]',
    '.mermaid-diagram[aria-label="公開パイプライン"]',
  ];
  for (const selector of requiredSelectors) {
    if (!await page.locator(selector).count()) {
      throw new Error(`Editorial story is missing ${selector}`);
    }
  }
  const copy = page.getByRole("button", { name: /^[^、]*をコピー$/u }).first();
  await copy.click();
  await page.getByRole("button", { name: /をコピーしました$/u }).first().waitFor();
  await page.getByText(/をコピーしました$/u).first().waitFor();
  await context.close();
}

async function checkMotionStories(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await openStory(page, baseUrl, "motion-page-transitions--full");
  await page.getByRole("button", { name: "Navigate" }).click();
  await page.getByText("View transitions: 1").waitFor();
  await page.getByRole("button", { name: "Navigate" }).click();
  await page.getByText("View transitions: 2").waitFor();

  await openStory(page, baseUrl, "motion-page-transitions--reduced");
  await page.getByRole("button", { name: "Navigate" }).click();
  await page.getByText("View transitions: 0").waitFor();

  await context.close();

  const fallbackContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await fallbackContext.addInitScript(() => {
    Object.defineProperty(Document.prototype, "startViewTransition", {
      configurable: true,
      value: undefined,
    });
  });
  const fallbackPage = await fallbackContext.newPage();
  await openStory(fallbackPage, baseUrl, "motion-page-transitions--full");
  await fallbackPage.getByRole("button", { name: "Navigate" }).click();
  await fallbackPage.getByText("Frame / detail").waitFor();
  await fallbackPage.getByText("View transitions: 0").waitFor();
  await fallbackContext.close();
}

const abortController = new AbortController();
const server = Deno.serve(
  {
    hostname: "127.0.0.1",
    port: 0,
    signal: abortController.signal,
    onListen: () => {},
  },
  serveStatic,
);
const address = server.addr as Deno.NetAddr;
const baseUrl = `http://${address.hostname}:${address.port}`;

try {
  const index = JSON.parse(await Deno.readTextFile(new URL("index.json", outputDirectory))) as {
    entries: Record<string, StoryEntry>;
  };
  const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
  const docs = Object.values(index.entries).filter((entry) => entry.type === "docs");
  for (const group of requiredGroups) {
    if (!stories.some((story) => story.title.startsWith(group))) {
      throw new Error(`Storybook is missing the ${group} group`);
    }
  }
  if (!docs.length) throw new Error("Storybook autodocs entries were not generated");

  const browser = await chromium.launch({ headless: browserHeadless });
  try {
    let context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let page = await context.newPage();
    for (const [index, story] of stories.entries()) {
      await assertStory(page, baseUrl, story);
      // Storybook は遷移をまたいで状態を保持するため、定期的にページを作り直してメモリを抑える。
      if ((index + 1) % 12 === 0 && index + 1 < stories.length) {
        await context.close();
        context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        page = await context.newPage();
      }
    }
    const docsErrors: string[] = [];
    page.on("pageerror", (error) => docsErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") docsErrors.push(message.text());
    });
    await page.goto(`${baseUrl}/?path=/docs/${docs[0].id}`, { waitUntil: "networkidle" });
    if (docsErrors.length) throw new Error(`Storybook Docs: ${docsErrors.join(" | ")}`);
    await context.close();
    await checkHeaderKeyboard(baseUrl, browser);
    await checkHomePatternInteractions(baseUrl, browser);
    await checkResponsiveContexts(baseUrl, browser, stories);
    await checkIncreasedText(baseUrl, browser, stories);
    await checkEditorialRendering(baseUrl, browser);
    await checkMotionStories(baseUrl, browser);
  } finally {
    await browser.close();
  }

  console.log(
    `Storybook validated: ${stories.length} stories, axe, responsive, editorial, motion.`,
  );
} finally {
  abortController.abort();
  await server.finished.catch(() => {});
}
