import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import type { AuthoredMedia } from "@lunacea/config";
import type { Content, Location, WeatherState } from "@lunacea/schemas";
import { SettingsPanel } from "$ui/components/index.ts";
import { MediaSlot } from "$ui/visuals/index.ts";
import ReadingEnhancements from "$ui/patterns/ReadingEnhancements.svelte";
import ReactionBar from "$lib/components/ReactionBar.svelte";
import WeatherWidget from "$lib/components/WeatherWidget.svelte";
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
  it("persists theme and motion without hiding native keyboard controls", async () => {
    const view = render(SettingsPanel);
    await fireEvent.click(view.getByRole("button", { name: "Display" }));
    const [theme, motion] = view.getAllByRole("combobox") as HTMLSelectElement[];
    theme.focus();
    expect(document.activeElement).toBe(theme);

    await fireEvent.change(theme, { target: { value: "dark" } });
    await fireEvent.change(motion, { target: { value: "off" } });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.motion).toBe("off");
    expect(localStorage.getItem("lunacea-theme")).toBe("dark");
    expect(localStorage.getItem("lunacea-motion")).toBe("off");
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
        }],
      },
    });
    const form = view.getByRole("searchbox").closest("form");
    expect(form?.method).toContain("get");
    expect(view.getByRole("link", { name: /天候を環境情報にする/ })).toBeTruthy();
    expect(view.getByText("1 records")).toBeTruthy();
  });
});

describe("weather location picker", () => {
  it("searches a city, stores the explicit selection, and refreshes weather", async () => {
    const selected: Location = {
      id: "morioka-station",
      name: "盛岡駅前",
      region: "岩手県",
      country: "日本",
      latitude: 39.701,
      longitude: 141.136,
      timezone: "Asia/Tokyo",
    };
    const weather = (name: string): WeatherState => ({
      location: { ...selected, name },
      observedAt: "2026-07-14T12:00",
      temperatureC: 22,
      condition: "clear",
      phase: "day",
      source: "open-meteo",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/locations")) {
          return new Response(JSON.stringify({ locations: [selected] }));
        }
        const name = new URL(url, "http://localhost").searchParams.get("name") ?? "盛岡";
        return new Response(JSON.stringify(weather(name)));
      }),
    );

    const view = render(WeatherWidget);
    await waitFor(() => expect(view.getByText("22°C")).toBeTruthy());
    await fireEvent.click(view.getByRole("button", { name: /環境・表示/ }));
    await fireEvent.input(view.getByLabelText("都市名"), { target: { value: "盛岡駅" } });
    await fireEvent.click(view.getByRole("button", { name: "検索" }));
    const result = await view.findByText("盛岡駅前");
    await fireEvent.click(result.closest("button")!);

    expect(JSON.parse(localStorage.getItem("lunacea-location") ?? "null").id)
      .toBe("morioka-station");
    await waitFor(() => expect(view.getByText(/Environment \/ 盛岡駅前/)).toBeTruthy());
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
