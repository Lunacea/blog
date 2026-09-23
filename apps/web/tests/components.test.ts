import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import type { Content } from "@lunacea/schemas";
import SettingsPanel from "$lib/preferences/SettingsPanel.svelte";
import ThemeToggle from "$lib/preferences/ThemeToggle.svelte";
import ReadingEnhancements from "$lib/articles/ReadingEnhancements.svelte";
import ReadingSurface from "$lib/articles/ReadingSurface.svelte";
import ProfileCard from "$lib/home/ProfileCard.svelte";
import ReactionBar from "$lib/articles/ReactionBar.svelte";
import { loadFixedLocationWeather, type WeatherContextState } from "$lib/weather.ts";
import { get, writable } from "svelte/store";
import ArticlesPage from "../src/routes/articles/+page.svelte";
import LinkPreviewFixture from "./LinkPreviewFixture.svelte";
import ReadingSurfaceFirstFixture from "./ReadingSurfaceFirstFixture.svelte";
import ReadingSurfaceSecondFixture from "./ReadingSurfaceSecondFixture.svelte";

const article = {
  type: "article",
  slug: "test-article",
  title: "テスト記事",
  summary: "テスト対象に使う十分な長さを備えた記事概要です。",
  publishedAt: "2026-01-01",
  tags: ["Test"],
  status: "stable",
  featured: false,
  draft: false,
  sample: true,
  legacyIds: [],
  legacyPaths: [],
  related: [],
  revisions: [],
  category: "engineering",
  targetVersions: [],
} satisfies Content;

describe("display preferences", () => {
  it("cycles and persists motion through one keyboard-accessible icon control", async () => {
    localStorage.setItem("lunacea-motion", "full");
    const view = render(SettingsPanel);
    const companion = render(SettingsPanel);
    const display = view.container.querySelector<HTMLButtonElement>(".settings-trigger")!;
    const companionDisplay = companion.container.querySelector<HTMLButtonElement>(
      ".settings-trigger",
    )!;
    display.focus();
    expect(document.activeElement).toBe(display);
    expect(display.querySelectorAll('[data-stroke="wave"]')).toHaveLength(2);
    expect(display.querySelector(".motion-glyph")?.getAttribute("data-mode")).toBe("full");
    await fireEvent.click(display);
    expect(document.documentElement.dataset.motion).toBe("off");
    expect(display.querySelectorAll('[data-stroke="wave"]')).toHaveLength(2);
    expect(display.querySelector(".motion-glyph")?.getAttribute("data-mode")).toBe("off");
    expect(display.querySelector(".wave-primary")).toBeTruthy();
    expect(display.querySelector(".wave-secondary")).toBeTruthy();
    expect(localStorage.getItem("lunacea-motion")).toBe("off");
    expect(display.getAttribute("aria-label")).toContain("アニメーション: OFF");
    expect(companionDisplay.getAttribute("aria-label")).toContain("アニメーション: OFF");
    await fireEvent.click(companionDisplay);
    expect(display.getAttribute("aria-label")).toContain("アニメーション: ON");
    expect(document.documentElement.dataset.motionPreference).toBe("full");
    expect(localStorage.getItem("lunacea-motion")).toBe("full");
    expect(display.getAttribute("aria-describedby")).not.toBe(
      companionDisplay.getAttribute("aria-describedby"),
    );
    expect(view.queryByLabelText("Theme")).toBeNull();
  });

  it("turns an automatic effective theme into an explicit opposite preference", async () => {
    document.documentElement.dataset.motion = "full";
    localStorage.setItem("lunacea-motion", "off");
    const view = render(ThemeToggle);
    const toggle = view.getByRole("button", { name: "ダークテーマに切り替える" });
    await fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.motion).toBe("full");
    expect(localStorage.getItem("lunacea-theme")).toBe("dark");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("Home profile card", () => {
  it("claims touch movement before Safari can begin scrolling the page", () => {
    const view = render(ProfileCard, {
      name: "Lunacea",
      role: "UI / UX Design — Web Engineering",
    });

    const card = view.getByRole("group", { name: "Lunaceaの名刺" });
    expect(card.classList.contains("touch-none")).toBe(true);
    expect(card.classList.contains("touch-pan-y")).toBe(false);
  });
});

describe("reading enhancements", () => {
  it("builds a table of contents and copies highlighted code", async () => {
    const prose = document.createElement("article");
    prose.className = "prose";
    prose.innerHTML =
      '<h2 id="overview">概要</h2><div class="code-block"><pre><code>const calm = true;</code></pre></div>';
    document.body.append(prose);
    const view = render(ReadingEnhancements);

    await waitFor(() => expect(view.getAllByRole("link", { name: "概要" })).toHaveLength(2));
    expect(view.container.querySelector(".toc-list")).toBeTruthy();
    expect(view.container.querySelector(".mobile-toc-region")).toBeTruthy();
    expect(view.container.querySelector(".mobile-toc-switch")).toBeNull();
    const copy = view.getByRole("button", { name: /をコピー$/ });
    await fireEvent.click(copy);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const calm = true;");
    await waitFor(() => expect(copy.querySelector("svg")?.dataset.glyph).toBe("copied"));
    expect(view.getByRole("tab", { name: "Preview" })).toBeTruthy();
    // ソースパネルは初期非表示なので role ではなくブロックから読む。
    const editor = prose.querySelector<HTMLTextAreaElement>("textarea");
    expect(editor?.value).toBe("const calm = true;");
  });

  it("reinitializes the current TOC marker when the article component changes", async () => {
    const firstHeadings = [
      { id: "first-start", text: "最初の記事の冒頭", level: 2 },
      { id: "first-end", text: "最初の記事の末尾", level: 2 },
    ];
    const secondHeadings = [
      { id: "second-start", text: "次の記事の冒頭", level: 2 },
      { id: "second-end", text: "次の記事の末尾", level: 2 },
    ];
    const view = render(ReadingSurface, {
      component: ReadingSurfaceFirstFixture,
      headings: firstHeadings,
    });

    await waitFor(() => {
      expect(
        view.getAllByRole("link", { name: "最初の記事の末尾" })[0]?.getAttribute(
          "aria-current",
        ),
      ).toBe("location");
    });

    await view.rerender({
      component: ReadingSurfaceSecondFixture,
      headings: secondHeadings,
    });

    await waitFor(() => {
      expect(
        view.getAllByRole("link", { name: "次の記事の末尾" })[0]?.getAttribute(
          "aria-current",
        ),
      ).toBe("location");
    });
  });
});

describe("article catalog", () => {
  const catalogData = {
    query: "天候",
    filters: { category: "design" as const, tag: undefined },
    sort: "relevance" as const,
    view: "list" as const,
    isFiltered: true,
    serendipity: [],
    ranking: [] as Array<{ slug: string; impressions: number }>,
    facets: {
      categories: ["design" as const],
      tags: ["Weather"],
      categoryCounts: { design: 1 },
      tagCounts: { Weather: 1 },
    },
    entries: [{
      id: "article:weather",
      type: "article" as const,
      slug: "weather",
      title: "天候を環境情報にする",
      summary: "天候を静かな環境情報として表示するための記事です。",
      tags: ["Weather"],
      publishedAt: "2026-01-01",
      category: "design" as const,
      status: "stable" as const,
      legacyIds: [] as string[],
      body: "天候",
      href: "/articles/weather",
      cover: undefined,
      composition: {
        estimatedMinutes: 3,
        textCharacters: 900,
        paperLayers: 3,
        blocks: [],
        sections: [],
      },
    }],
  };

  it("keeps the category rail, the filter summary and the search form the catalog closes with", () => {
    const view = render(ArticlesPage, { data: structuredClone(catalogData) });

    expect(view.getByRole("navigation", { name: "カテゴリ" })).toBeTruthy();
    expect(view.getByRole("searchbox")).toBeTruthy();
    expect(view.getByRole("link", { name: /天候を環境情報にする/ })).toBeTruthy();
    expect(view.getByRole("link", { name: "条件を解除" })).toBeTruthy();
    expect(view.getByRole("link", { name: "#Weather" })).toBeTruthy();
  });

  it("lists every record in one index with its date, category and tags", () => {
    const entries = ["a", "b", "c", "d", "e", "f", "g"].map((slug, index) => ({
      ...catalogData.entries[0],
      id: `article:${slug}`,
      slug,
      title: `記事${slug}`,
      href: `/articles/${slug}`,
      publishedAt: `2026-0${index + 1}-01`,
    }));
    const view = render(ArticlesPage, {
      data: {
        ...structuredClone(catalogData),
        query: "",
        sort: "published" as const,
        isFiltered: false,
        entries,
      },
    });

    const list = view.getByRole("list", { name: "記事一覧" });
    const rows = list.querySelectorAll(":scope > li");
    expect(rows).toHaveLength(7);
    expect(rows[0]?.querySelector("h3")?.textContent).toBe("記事a");
    expect(rows[0]?.querySelector("time")?.textContent).toBe("2026.01.01");
    expect(view.queryByRole("link", { name: "条件を解除" })).toBeNull();
  });
});

describe("link previews", () => {
  it("resolves href-only cards from the reading context", () => {
    const view = render(LinkPreviewFixture);
    expect(view.getByRole("link", { name: /Cached article title/ })).toBeTruthy();
    expect(view.getByText("Cached article description")).toBeTruthy();
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe(
      "/images/ogp/example.webp",
    );
  });
});

describe("weather environment controller", () => {
  it("loads only the configured fixed location and stores no visitor location", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      expect(url.searchParams.get("id")).toBe("morioka-jp");
      return Promise.resolve(
        new Response(JSON.stringify({
          location: {
            id: "morioka-jp",
            name: "盛岡",
            region: "岩手県",
            country: "日本",
            latitude: 39.7036,
            longitude: 141.1527,
            timezone: "Asia/Tokyo",
          },
          observedAt: "2026-07-14T12:00",
          temperatureC: 22,
          condition: "clear",
          phase: "day",
          source: "open-meteo",
        })),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const state = writable<WeatherContextState>({
      visual: "neutral",
      intensity: "steady",
      loaded: false,
    });
    await loadFixedLocationWeather(state);

    const resolved = get(state);
    expect(resolved.loaded).toBe(true);
    // clear の観測は clear か通り雨のいずれか。通り雨は必ず passing。
    expect(["clear", "rain", "snow"]).toContain(resolved.visual);
    if (resolved.visual !== "clear") expect(resolved.intensity).toBe("passing");
    expect(localStorage.getItem("lunacea-location")).toBeNull();
  });
});

describe("reactions", () => {
  it("loads and toggles an anonymous reaction", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          contentId: "article:test-article",
          count: 0,
          selected: false,
        })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          contentId: "article:test-article",
          count: 1,
          selected: true,
        })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const view = render(ReactionBar, { content: article });
    const button = await view.findByRole("button", { name: "称賛する" });
    expect(view.queryByText("Response")).toBeNull();
    expect(view.queryByText("この記録をどう感じましたか")).toBeNull();
    expect(button.querySelector("svg")).toBeTruthy();
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
    await fireEvent.click(button);

    await waitFor(() => expect(button.getAttribute("aria-pressed")).toBe("true"));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PUT" });
    expect(view.getByText("称賛しました")).toBeTruthy();
  });
});
