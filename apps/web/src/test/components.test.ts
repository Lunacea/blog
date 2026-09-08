import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import type { AuthoredMedia } from "@lunacea/config";
import type { Content } from "@lunacea/schemas";
import { SettingsPanel, ThemeToggle } from "$ui/components/index.ts";
import { ThemeGlyph } from "$ui/icons/index.ts";
import { MediaSlot } from "$ui/visuals/index.ts";
import ReadingEnhancements from "$ui/patterns/ReadingEnhancements.svelte";
import ReadingSurface from "$ui/patterns/ReadingSurface.svelte";
import GlassProfileCard from "$ui/patterns/GlassProfileCard.svelte";
import ProfileCard from "$ui/patterns/ProfileCard.svelte";
import ReactionBar from "$lib/components/ReactionBar.svelte";
import { loadFixedLocationWeather } from "$lib/weather.ts";
import { get, writable } from "svelte/store";
import ArticlesPage from "../routes/articles/+page.svelte";
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
    const display = view.getByRole("button", { name: /アニメーション: ON/ });
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

describe("theme glyph", () => {
  it("shares optically aligned filled geometry without sun rays", () => {
    const view = render(ThemeGlyph);
    const sun = view.container.querySelector<SVGElement>("svg.sun");
    const moon = view.container.querySelector<SVGElement>("svg.moon");

    expect(sun?.getAttribute("viewBox")).toBe("0 0 13.276 13.276");
    expect(moon?.getAttribute("viewBox")).toBe("1.624 5.1 13.276 13.276");
    expect(sun?.querySelectorAll("circle")).toHaveLength(1);
    expect(sun?.querySelector("path")).toBeNull();
  });
});

describe("authored media slots", () => {
  it("renders supplied media and keeps empty slots structural", () => {
    const asset: AuthoredMedia = {
      src: "/images/archive/morioka-concrete.webp",
      alt: "差し替え可能なプロフィール",
      width: 960,
      height: 1200,
      aspectRatio: "4 / 5",
      objectPosition: "50% 30%",
      variant: "portrait",
      loading: "lazy",
      opacity: 0.9,
      allowMotion: false,
      placeholder: {
        assetId: "test-portrait",
        role: "テスト画像",
        preferredFileType: "AVIF/WebP",
        accessibilityDescription: "テスト用の画像説明",
        transparencyRequired: false,
      },
    };
    const supplied = render(MediaSlot, { asset });
    expect(supplied.getByRole("img", { name: asset.alt })).toBeTruthy();

    const empty = render(MediaSlot, {
      asset: { ...asset, src: null, alt: "" },
      showPlaceholder: true,
    });
    expect(empty.getByRole("img", { name: /Authored media slot/ })).toBeTruthy();
    expect(empty.container.querySelector("img")).toBeNull();
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

  it("keeps the compact identity and contact links separate from drag handling", () => {
    const asset: AuthoredMedia = {
      src: "/images/profile.webp",
      alt: "プロフィールキャラクター",
      width: 960,
      height: 960,
      aspectRatio: "1 / 1",
      objectPosition: "50% 50%",
      variant: "organic",
      loading: "lazy",
      opacity: 1,
      allowMotion: false,
      placeholder: {
        assetId: "profile",
        role: "プロフィール",
        preferredFileType: "AVIF/WebP",
        accessibilityDescription: "プロフィールキャラクター",
        transparencyRequired: true,
      },
    };
    const view = render(GlassProfileCard, {
      asset,
      name: "Lunacea",
      field: "Interactive Systems / Design Research",
      github: "https://github.com/example",
      x: "https://x.com/example",
      email: "mailto:hello@example.com",
    });

    expect(view.getByRole("heading", { level: 2, name: "Lunacea" })).toBeTruthy();
    expect(view.getByText("Interactive Systems")).toBeTruthy();
    expect(view.getByText("Design Research")).toBeTruthy();
    expect(view.container.querySelectorAll(".roles > span")).toHaveLength(2);
    expect(view.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe(
      "https://github.com/example",
    );
    expect(view.getByRole("link", { name: "X" }).getAttribute("href")).toBe(
      "https://x.com/example",
    );
    expect(view.getByRole("link", { name: "Email" }).getAttribute("href")).toBe(
      "mailto:hello@example.com",
    );
    expect(view.container.querySelectorAll(".contact-list svg")).toHaveLength(3);
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
    const copy = view.getByRole("button", { name: "Copy" });
    await fireEvent.click(copy);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const calm = true;");
    // The same block offers its source for editing, and a way back to the authored text.
    expect(view.getByRole("tab", { name: "Preview" })).toBeTruthy();
    // The source panel starts hidden, so it is read from the block rather than by role.
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
    // Search and tags are demoted to the end of the page rather than removed.
    expect(view.getByRole("searchbox")).toBeTruthy();
    expect(view.getByRole("link", { name: /天候を環境情報にする/ })).toBeTruthy();
    expect(view.getByRole("link", { name: "Clear" })).toBeTruthy();
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
    // The date replaces the folio number, and tags no longer wait for a hover.
    expect(rows[0]?.querySelector("time")?.textContent).toBe("2026.01.01");
    expect(rows[6]?.querySelector("time")?.textContent).toBe("2026.07.01");
    expect(rows[0]?.textContent).toContain("#Weather");
    expect(rows[0]?.textContent).toContain("design");
    expect(view.queryByRole("link", { name: "Clear" })).toBeNull();
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
    const state = writable({ visual: "neutral" as const, loaded: false });
    await loadFixedLocationWeather(state);

    expect(get(state)).toEqual({ visual: "clear", loaded: true });
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
