import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import type { AuthoredMedia } from "@lunacea/config";
import type { Content } from "@lunacea/schemas";
import { SettingsPanel, ThemeToggle } from "$ui/components/index.ts";
import { ThemeGlyph } from "$ui/icons/index.ts";
import { MediaSlot } from "$ui/visuals/index.ts";
import ReadingEnhancements from "$ui/patterns/ReadingEnhancements.svelte";
import GlassProfileCard from "$ui/patterns/GlassProfileCard.svelte";
import ReactionBar from "$lib/components/ReactionBar.svelte";
import { loadFixedLocationWeather } from "$lib/weather-context.ts";
import { get, writable } from "svelte/store";
import ArticlesPage from "../routes/articles/+page.svelte";

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
  it("persists motion through keyboard-accessible text controls", async () => {
    const view = render(SettingsPanel);
    await fireEvent.click(view.getByRole("button", { name: "Display" }));
    const motion = view.getByRole("group", { name: "Motion" });
    const off = view.getByRole("button", { name: "Off" });
    off.focus();
    expect(document.activeElement).toBe(off);

    await fireEvent.click(off);

    expect(document.documentElement.dataset.motion).toBe("off");
    expect(localStorage.getItem("lunacea-motion")).toBe("off");
    expect(motion.querySelector('[aria-pressed="true"]')?.textContent?.trim()).toBe("Off");
    expect(view.queryByLabelText("Theme")).toBeNull();
  });

  it("turns an automatic effective theme into an explicit opposite preference", async () => {
    const view = render(ThemeToggle);
    const toggle = view.getByRole("button", { name: "ダークテーマに切り替える" });
    await fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
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
    expect(view.getByText("Interactive Systems / Design Research")).toBeTruthy();
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
    const copy = view.getByRole("button", { name: "コードをコピー" });
    await fireEvent.click(copy);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const calm = true;");
  });
});

describe("article search UI", () => {
  it("renders a GET form and filtered records from server data", () => {
    const view = render(ArticlesPage, {
      data: {
        query: "天候",
        filters: { category: "design", tag: undefined },
        sort: "relevance",
        view: "list",
        isFiltered: true,
        entries: [{
          id: "article:weather",
          type: "article",
          slug: "weather",
          title: "天候を環境情報にする",
          summary: "天候を静かな環境情報として表示するための記事です。",
          tags: ["Weather"],
          publishedAt: "2026-01-01",
          category: "design",
          status: "stable",
          legacyIds: [],
          body: "天候",
          href: "/articles/weather",
          cover: undefined,
        }],
      },
    });
    const form = view.getByRole("searchbox").closest("form");
    expect(form?.method).toContain("get");
    expect(view.getByRole("link", { name: /天候を環境情報にする/ })).toBeTruthy();
    expect(view.getByText(/1 records/)).toBeTruthy();
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
          counts: { useful: 0, inspiring: 0, love: 0 },
          selected: [],
        })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          contentId: "article:test-article",
          counts: { useful: 1, inspiring: 0, love: 0 },
          selected: ["useful"],
        })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const view = render(ReactionBar, { content: article });
    const button = await view.findByRole("button", { name: /参考になった/ });
    expect(button.querySelector("svg")).toBeTruthy();
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
    await fireEvent.click(button);

    await waitFor(() => expect(button.getAttribute("aria-pressed")).toBe("true"));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PUT" });
    expect(view.getByText("リアクションを追加しました")).toBeTruthy();
  });
});
