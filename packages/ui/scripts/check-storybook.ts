/// <reference lib="dom" />

import { AxeBuilder } from "@axe-core/playwright";
import { chromium, type ConsoleMessage, type Page } from "playwright";
import sharp from "sharp";

const browserHeadless = Deno.env.get("STORYBOOK_HEADED") !== "true";

const outputDirectory = new URL("../storybook-static/", import.meta.url);
const requiredGroups = [
  "Components/",
  "Foundations/",
  "Layout/",
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

async function checkVisualBaselines(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const update = Deno.env.get("UPDATE_VISUAL_BASELINES") === "true";
  const directory = new URL("../visual-baselines/", import.meta.url);
  const stories = [
    "components-siteheader--desktop",
    "components-filterselector--default",
    "components-viewtoggle--grid",
    "patterns-glassprofilecard--placeholder",
    "visuals-assetplaceholder--profile-character",
    "visuals-ambienthero--static-fallback",
  ];
  const viewports = [
    { name: "mobile", width: 320, height: 720 },
    { name: "desktop", width: 1280, height: 900 },
  ];
  if (update) await Deno.mkdir(directory, { recursive: true });

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const theme of ["light", "dark"] as const) {
      for (const story of stories) {
        await openStory(page, baseUrl, story);
        await page.evaluate((selectedTheme) => {
          document.documentElement.dataset.theme = selectedTheme;
          document.documentElement.dataset.motion = "off";
        }, theme);
        await page.evaluate(() => document.fonts.ready);
        const screenshot = await page.screenshot({ animations: "disabled" });
        const name = `${story}.${viewport.name}.${theme}.png`;
        const baselineUrl = new URL(name, directory);
        if (update) {
          await Deno.writeFile(baselineUrl, screenshot);
          continue;
        }

        let baseline: Uint8Array;
        try {
          baseline = await Deno.readFile(baselineUrl);
        } catch (error) {
          if (error instanceof Deno.errors.NotFound) {
            throw new Error(
              `Missing visual baseline ${name}; update explicitly with UPDATE_VISUAL_BASELINES=true`,
            );
          }
          throw error;
        }
        const [actual, expected] = await Promise.all([
          sharp(screenshot).raw().toBuffer({ resolveWithObject: true }),
          sharp(baseline).raw().toBuffer({ resolveWithObject: true }),
        ]);
        if (
          actual.info.width !== expected.info.width ||
          actual.info.height !== expected.info.height ||
          actual.info.channels !== expected.info.channels
        ) throw new Error(`${name}: visual baseline dimensions changed`);
        let changed = 0;
        for (let index = 0; index < actual.data.length; index += 1) {
          if (Math.abs(actual.data[index] - expected.data[index]) > 16) changed += 1;
        }
        const ratio = changed / actual.data.length;
        if (ratio > .002) {
          throw new Error(`${name}: visual difference ${(ratio * 100).toFixed(3)}%`);
        }
      }
    }
    await context.close();
  }
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
  const actions = page.locator(".header-actions > *");
  if (await actions.count() !== 3) {
    throw new Error("SiteHeader mobile actions are not Theme, Display, Hamburger");
  }
  if (!await page.getByRole("button", { name: /テーマに切り替える/u }).count()) {
    throw new Error("SiteHeader has no accessible Theme control");
  }
  const trigger = page.locator(".menu-trigger");
  if (await trigger.getAttribute("aria-label") !== "メニューを開く") {
    throw new Error("SiteHeader mobile menu has no accessible open label");
  }
  await trigger.click();
  if (await trigger.getAttribute("aria-expanded") !== "true") {
    throw new Error("SiteHeader mobile menu did not open");
  }
  const links = await page.getByRole("navigation", { name: "主要ナビゲーション（モバイル）" })
    .getByRole("link").allTextContents();
  if (
    links.map((label) => label.replace(/^\d+/u, "")).join(",") !== "Home,Articles,Works,Archive"
  ) {
    throw new Error(`SiteHeader mobile menu has unexpected links: ${links.join(", ")}`);
  }
  await page.keyboard.press("Escape");
  if (await trigger.getAttribute("aria-expanded") !== "false") {
    throw new Error("SiteHeader mobile menu did not close with Escape");
  }
  if (!await trigger.evaluate((element) => element === document.activeElement)) {
    throw new Error("SiteHeader did not return focus after Escape");
  }
  await context.close();
}

async function checkWeatherStories(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  for (const condition of ["clear", "cloudy", "rain", "snow"] as const) {
    await openStory(page, baseUrl, `visuals-ambienthero--${condition}`);
    if (await page.locator("[data-weather]").getAttribute("data-weather") !== condition) {
      throw new Error(`AmbientHero did not receive ${condition} weather`);
    }
  }
  await context.close();
}

async function checkHomePatternInteractions(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await openStory(page, baseUrl, "visuals-ambienthero--minimal-without-central-motif");
  if (await page.locator("[data-central-fallback]").isVisible()) {
    throw new Error("Minimal AmbientHero still exposes the central fallback motif");
  }

  await openStory(page, baseUrl, "patterns-glassprofilecard--placeholder");
  const card = page.locator(".profile-card");
  const links = card.getByRole("link");
  if (await links.count() !== 3) {
    throw new Error("GlassProfileCard does not expose the three configured contact links");
  }
  const linkBox = await links.first().boundingBox();
  if (!linkBox) throw new Error("GlassProfileCard GitHub link has no hit area");
  await page.mouse.move(linkBox.x + linkBox.width / 2, linkBox.y + linkBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(linkBox.x + linkBox.width / 2 + 40, linkBox.y + linkBox.height / 2);
  await page.mouse.up();
  if (await card.getAttribute("data-dragging") !== "false") {
    throw new Error("GlassProfileCard contact link incorrectly initiated drag");
  }

  await context.close();
}

async function checkMotionCaps(
  baseUrl: string,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  for (
    const options of [
      { name: "reduced motion", reducedMotion: "reduce" as const },
      { name: "forced colors", forcedColors: "active" as const },
    ]
  ) {
    const { name, ...media } = options;
    const context = await browser.newContext({ ...media, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await openStory(page, baseUrl, "visuals-ambienthero--enhanced-when-capable");
    const state = await page.evaluate(() => ({
      motion: document.documentElement.dataset.motion,
      webgl: document.querySelector("[data-webgl]")?.getAttribute("data-webgl"),
    }));
    if (state.motion !== "reduced" || state.webgl !== "false") {
      throw new Error(`${name}: expected reduced/no-WebGL, received ${JSON.stringify(state)}`);
    }
    await context.close();
  }
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
  const copy = page.getByRole("button", { name: "コードをコピー" });
  await copy.click();
  await page.getByRole("button", { name: "コードをコピーしました" }).waitFor();
  await page.getByText("コードをコピーしました", { exact: true }).waitFor();
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

  await openStory(page, baseUrl, "motion-reveal--full");
  await page.locator('[data-reveal][data-visible="true"]').first().waitFor();
  await openStory(page, baseUrl, "motion-reveal--off");
  if (await page.locator('[data-reveal]:not([data-visible="true"])').count()) {
    throw new Error("Off motion left reveal content hidden");
  }
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

async function checkVisualFallbacks(baseUrl: string) {
  // The all-story pass creates and destroys several WebGL contexts. Use a fresh GPU process here
  // so context-loss behavior is deterministic instead of depending on Chromium's context quota.
  const browser = await chromium.launch({ headless: browserHeadless });
  try {
    const fallbackCases = [
      {
        name: "save-data",
        init: `Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true, addEventListener() {}, removeEventListener() {} }
      });`,
      },
      {
        name: "low capability",
        init: `Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 2 });
        Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, value: 2 });`,
      },
      {
        name: "no WebGL2",
        init: `const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          if (type === "webgl2") return null;
          return originalGetContext.call(this, type, ...args);
        };`,
      },
    ];

    for (const fallback of fallbackCases) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(fallback.init);
      const page = await context.newPage();
      await openStory(page, baseUrl, "visuals-ambienthero--enhanced-when-capable");
      await page.waitForTimeout(300);
      const webgl = await page.locator("[data-webgl]").getAttribute("data-webgl");
      if (webgl !== "false" || await page.locator("canvas").count()) {
        throw new Error(`${fallback.name}: WebGL fallback did not remain active`);
      }
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await openStory(page, baseUrl, "visuals-ambienthero--enhanced-when-capable");
    const supportsWebGL2 = await page.evaluate(() =>
      Boolean(document.createElement("canvas").getContext("webgl2"))
    );
    if (!supportsWebGL2) {
      if (await page.locator("[data-webgl]").getAttribute("data-webgl") !== "false") {
        throw new Error("Missing WebGL2 did not preserve the static fallback");
      }
      console.log("Storybook context-loss check skipped: this browser exposes no WebGL2.");
      await context.close();
      return;
    }
    const visual = page.locator('[data-webgl="true"]');
    const canvas = visual.locator("canvas");
    await canvas.waitFor({ timeout: 20_000 });
    if (await visual.evaluate((element) => getComputedStyle(element).touchAction) !== "pan-y") {
      throw new Error("WebGL interaction does not preserve vertical touch scrolling");
    }
    const bounds = await visual.boundingBox();
    if (!bounds) throw new Error("WebGL interaction surface has no bounds");
    const initialYaw = Number(await visual.getAttribute("data-yaw"));
    // Use the open part of the preview rather than the semantic text layer above the visual.
    await page.mouse.move(bounds.x + bounds.width * .7, bounds.y + bounds.height * .75);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .85, bounds.y + bounds.height * .78, {
      steps: 4,
    });
    await page.waitForFunction(() =>
      document.querySelector("[data-webgl]")?.getAttribute("data-pointer-intent") === "drag"
    );
    await page.waitForFunction(
      (yaw) => Number(document.querySelector("[data-webgl]")?.getAttribute("data-yaw")) !== yaw,
      initialYaw,
    );
    await page.mouse.up();
    await page.waitForFunction(() =>
      document.querySelector("[data-webgl]")?.getAttribute("data-pointer-intent") === "idle"
    );
    await canvas.dispatchEvent("webglcontextlost");
    await page.waitForFunction(() =>
      document.querySelector("[data-webgl]")?.getAttribute("data-webgl") === "false"
    );
    if (await page.locator("canvas").count()) {
      throw new Error("WebGL context loss did not remove the failed canvas");
    }
    await context.close();
  } finally {
    await browser.close();
  }
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
      // Storybook retains module and canvas state across navigations. Periodically recycling the
      // page bounds memory use so the full accessibility pass remains stable in headless Chromium.
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
    await checkWeatherStories(baseUrl, browser);
    await checkHomePatternInteractions(baseUrl, browser);
    await checkResponsiveContexts(baseUrl, browser, stories);
    await checkIncreasedText(baseUrl, browser, stories);
    await checkMotionCaps(baseUrl, browser);
    await checkEditorialRendering(baseUrl, browser);
    await checkMotionStories(baseUrl, browser);
    await checkVisualFallbacks(baseUrl);
    await checkVisualBaselines(baseUrl, browser);
  } finally {
    await browser.close();
  }

  console.log(
    `Storybook validated: ${stories.length} stories, axe, responsive, visual baselines, editorial, motion, WebGL fallbacks.`,
  );
} finally {
  abortController.abort();
  await server.finished.catch(() => {});
}
