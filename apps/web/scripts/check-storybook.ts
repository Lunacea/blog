/// <reference lib="dom" />

import { AxeBuilder } from "@axe-core/playwright";
import { chromium, type ConsoleMessage, type Page } from "playwright";
import { headlessBrowserEnv } from "./browser-env.ts";

const browserHeadless = Deno.env.get("STORYBOOK_HEADED") !== "true";

const outputDirectory = new URL("../storybook-static/", import.meta.url);
const requiredGroups = [
  "Articles/",
  "Home/",
  "Shell/",
  "UI/",
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

/**
 * ページの実行時エラーを集め続ける。story の切り替え中の描画で起きたエラーも拾えるよう、
 * 切り替えより前から見張り、story ごとに空にして読む。
 */
function watchRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message: ConsoleMessage) => {
    const browserDriverWarning = message.type() === "warning" &&
      /GL Driver Message.*GPU stall due to ReadPixels/.test(message.text());
    const unavailableWebgl =
      /THREE\.WebGLRenderer: (?:A WebGL context could not be created|Error creating WebGL context)/
        .test(message.text());
    if (
      !["error", "warning"].includes(message.type()) || browserDriverWarning || unavailableWebgl
    ) {
      return;
    }
    const location = message.location();
    const source = location.url ? ` (${location.url}:${location.lineNumber})` : "";
    errors.push(`${message.text()}${source}`);
  });
  return errors;
}

async function assertStory(page: Page, story: StoryEntry, errors: string[]): Promise<void> {
  if (!(await page.locator("#storybook-root > *").count())) {
    throw new Error(`${story.id}: empty body`);
  }
  if (errors.length) throw new Error(`${story.id}: ${errors.join(" | ")}`);

  const accessibility = await analyzeAccessibility(page);
  if (accessibility.violations.length) {
    const details = accessibility.violations.flatMap((violation) =>
      violation.nodes.map((node) =>
        `${violation.id} ${node.target.join(" ")}: ${node.failureSummary ?? violation.help}`
      )
    ).join(" | ");
    throw new Error(`${story.id}: axe violations ${details}`);
  }

  const overflow = await horizontalOverflow(page);
  if (overflow > 1) throw new Error(`${story.id}: horizontal overflow ${overflow}px`);
}

async function checkWeatherFallback(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, ...args) {
      if (type === "webgl" || type === "webgl2") return null;
      return getContext.call(this, type, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  const page = await context.newPage();
  await openStory(page, baseUrl, "visuals-weather-light--clear");
  const fallback = page.locator("[data-editorial-light]");
  await fallback.waitFor();
  await page.waitForTimeout(500);
  if (
    await fallback.getAttribute("data-webgl") === "true" || await fallback.locator("canvas").count()
  ) {
    throw new Error("EditorialLight did not keep its static fallback after WebGL failure");
  }
  await context.close();
}

/** ページごとに表示中の story。同じ story への切り替えは描き直されないので飛ばす。 */
const shown = new WeakMap<Page, string>();

/**
 * story を読み込み、描き終わるまで待つ。ネットワークが落ち着いても描画はまだのことがあり、
 * 並行して検査を回す CI ではその隙に要素を数えてしまう。
 */
async function openStory(page: Page, baseUrl: string, id: string) {
  await page.goto(`${baseUrl}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "networkidle" });
  await page.locator("#storybook-root > *").first().waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  shown.set(page, id);
}

/**
 * 読み込み直さずに story を切り替える。プレビューの JavaScript を毎回読み直すのが検査時間の
 * ほとんどを占めていたため、Storybook のチャネルで描画し直させ、描き終わりを待つ。
 */
const reloaded = (error: unknown) =>
  error instanceof Error && /Execution context was destroyed|navigation/u.test(error.message);

/**
 * story 1件分の検査。負荷の高い CI ではプレビュー自体が読み込み直されることがあり、そうなると
 * 検査の途中の評価が失敗する。そのときは story を開き直して、検査を一度だけやり直す。
 */
async function checkStory(page: Page, baseUrl: string, id: string, check: () => Promise<void>) {
  try {
    await showStory(page, id);
    await check();
  } catch (error) {
    if (!reloaded(error)) throw error;
    await openStory(page, baseUrl, id);
    await check();
  }
}

async function showStory(page: Page, id: string) {
  // 表示中の story を指定しても描き直されず、描き終わりの知らせも来ない。
  if (shown.get(page) === id) return;
  await page.evaluate((storyId) =>
    new Promise<void>((resolve, reject) => {
      type Channel = {
        on(event: string, handler: (payload?: { storyId?: string }) => void): void;
        off(event: string, handler: (payload?: { storyId?: string }) => void): void;
        emit(event: string, payload: unknown): void;
      };
      const channel = (globalThis as typeof globalThis & { __STORYBOOK_ADDONS_CHANNEL__: Channel })
        .__STORYBOOK_ADDONS_CHANNEL__;
      const outcomes = ["storyRendered", "storyErrored", "storyThrewException", "storyMissing"];
      const handlers = outcomes.map((event) => {
        const handler = () => {
          cleanup();
          if (event === "storyRendered") resolve();
          else reject(new Error(`${storyId}: ${event}`));
        };
        channel.on(event, handler);
        return [event, handler] as const;
      });
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`${storyId}: did not render`));
      }, 15000);
      function cleanup() {
        clearTimeout(timer);
        for (const [event, handler] of handlers) channel.off(event, handler);
      }
      channel.emit("setCurrentStory", { storyId, viewMode: "story" });
    }), id);
  shown.set(page, id);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/** 最初の1件だけ読み込み、以降はチャネルで切り替える。 */
const openPreview = (page: Page, baseUrl: string, first: StoryEntry) =>
  openStory(page, baseUrl, first.id);

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * 1280px は assertStory が見ているので、それ以外の幅で横にはみ出さないかを見る。狭い2つの幅では
 * 同じ描画のまま文字を 200% にしても測る。幅ごとのページは並行して回す。
 */
async function checkLayouts(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  stories: StoryEntry[],
) {
  const layouts = [
    { name: "narrow mobile", width: 320, height: 720, enlargeText: true },
    { name: "tablet", width: 768, height: 1024, enlargeText: true },
    { name: "wide desktop", width: 1600, height: 1000, enlargeText: false },
  ];
  const failures = (await Promise.all(layouts.map(async (layout) => {
    const context = await browser.newContext({
      viewport: { width: layout.width, height: layout.height },
    });
    const page = await context.newPage();
    const found: string[] = [];
    try {
      await openPreview(page, baseUrl, stories[0]);
      for (const story of stories) {
        await checkStory(page, baseUrl, story.id, async () => {
          const overflow = await horizontalOverflow(page);
          if (overflow > 1) found.push(`${story.id} at ${layout.name}: ${overflow}px`);
          if (!layout.enlargeText) return;
          await page.evaluate(() => {
            document.documentElement.style.fontSize = "200%";
            return new Promise(requestAnimationFrame);
          });
          const enlarged = await horizontalOverflow(page);
          if (enlarged > 1) {
            found.push(`${story.id} at ${layout.width}px/200% text: ${enlarged}px`);
          }
          await page.evaluate(() => document.documentElement.style.removeProperty("font-size"));
        });
      }
    } finally {
      await context.close();
    }
    return found;
  }))).flat();
  if (failures.length) throw new Error(`Horizontal overflow:\n${failures.join("\n")}`);
}

async function checkHeaderKeyboard(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  await openStory(page, baseUrl, "shell-siteheader--mobile");

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

  await openStory(page, baseUrl, "home-profilecard--default");
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
  await openStory(page, baseUrl, "articles-editorial-reading-surface--complete-document");
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
  await openStory(page, baseUrl, "visuals-page-transitions--full");
  await page.getByRole("button", { name: "Navigate" }).click();
  await page.getByText("View transitions: 1").waitFor();
  await page.getByRole("button", { name: "Navigate" }).click();
  await page.getByText("View transitions: 2").waitFor();

  await openStory(page, baseUrl, "visuals-page-transitions--off");
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
  await openStory(fallbackPage, baseUrl, "visuals-page-transitions--full");
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

  const browser = await chromium.launch({
    headless: browserHeadless,
    env: browserHeadless ? headlessBrowserEnv() : undefined,
  });
  try {
    // 実行時エラーと axe は 1280px で見る。axe は1ページで同時に走らせられないので、story を
    // 2つのページに振り分けて並行させる。
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const lanes = [
      stories.filter((_, index) => index % 2 === 0),
      stories.filter((_, index) => index % 2 === 1),
    ];
    const auditing = Promise.all(lanes.map(async (lane) => {
      const lanePage = await context.newPage();
      const errors = watchRuntimeErrors(lanePage);
      await openPreview(lanePage, baseUrl, lane[0]);
      for (const story of lane) {
        await checkStory(lanePage, baseUrl, story.id, () => assertStory(lanePage, story, errors));
        // 最初の story は読み込みの時点で描かれているので、読んだ後に空にする。
        errors.length = 0;
      }
      await lanePage.close();
    }));
    const others = Promise.all([
      checkLayouts(baseUrl, browser, stories),
      checkHeaderKeyboard(baseUrl, browser),
      checkHomePatternInteractions(baseUrl, browser),
      checkEditorialRendering(baseUrl, browser),
      checkMotionStories(baseUrl, browser),
      checkWeatherFallback(baseUrl, browser),
    ]);
    await Promise.all([auditing, others]);
    const page = await context.newPage();
    const docsErrors: string[] = [];
    page.on("pageerror", (error) => docsErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") docsErrors.push(message.text());
    });
    await page.goto(`${baseUrl}/?path=/docs/${docs[0].id}`, { waitUntil: "networkidle" });
    if (docsErrors.length) throw new Error(`Storybook Docs: ${docsErrors.join(" | ")}`);
    await context.close();
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
