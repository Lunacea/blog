<script lang="ts">
  import { onMount, tick, type Snippet } from "svelte";
  import { IndexGlyph } from "@lunacea/ui/icons";
  import { Collapsible } from "@lunacea/ui/primitives";
  import { cn } from "@lunacea/ui/utils";
  import { motionDuration } from "$lib/motion-tokens.ts";
  import type { ArticleCompositionVisual } from "./article-composition-types.ts";
  import ArticleCompositionGraph from "./ArticleCompositionGraph.svelte";
  import { enhanceCodeBlocks } from "./code-blocks.ts";
  import { observeComposition } from "./composition-measure.ts";
  import { trackReadingPosition } from "./reading-position.ts";
  import { markerBounds, type TocSpan, tocSpans } from "./toc-geometry.ts";

  /**
   * 記事の読書用の拡張。目次（PC のレールと携帯の開閉）、読了進捗、読み上げ用の状態通知を描き、
   * 本文の拡張（構成の測定、読んでいる位置、コードブロック、図）を各モジュールに任せて束ねる。
   * JavaScript がなくても本文と目次は読める。
   */

  type Heading = { id: string; text: string; level: number };

  let {
    tools,
    root,
    headings: suppliedHeadings = [],
    composition,
  }: {
    /** PC の目次の下、同じ sticky レールの中に描く。 */
    tools?: Snippet;
    root?: HTMLElement | null;
    headings?: Heading[];
    composition?: ArticleCompositionVisual;
  } = $props();

  let discoveredHeadings = $state<Heading[]>([]);
  const headings = $derived(suppliedHeadings.length ? suppliedHeadings : discoveredHeadings);
  // 初回はビルド時の推定値を描き、本文のレイアウト後に実測値へ差し替える。
  let measured = $state<ArticleCompositionVisual | undefined>(undefined);
  const shownComposition = $derived(measured ?? composition);
  const tocRows = $derived(headings.map(() => "min-content").join(" "));

  let active = $state("");
  let progress = $state(0);
  let status = $state("");
  let tocOpen = $state(false);
  let enhancementsReady = $state(false);
  let desktopTocList = $state<HTMLOListElement | null>(null);
  let mobileTocList = $state<HTMLOListElement | null>(null);
  let spans = $state<TocSpan[]>([]);
  let desktopMarker = $state({ y: 0, height: 0 });
  let mobileMarker = $state({ y: 0, height: 0 });

  /** 目次から選んだ見出しは、スクロールが追いつくまで現在地として保つ。 */
  let requestedHeading = "";
  let requestTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  async function updateToc() {
    await tick();
    if (desktopTocList) spans = tocSpans(desktopTocList, headings.map((heading) => heading.id));
    desktopMarker = markerBounds(desktopTocList) ?? desktopMarker;
    mobileMarker = markerBounds(mobileTocList, 0) ?? mobileMarker;
  }

  $effect(() => {
    active;
    tocOpen;
    void updateToc();
  });

  function dismissToc(event: KeyboardEvent) {
    if (event.key !== "Escape" || !tocOpen) return;
    event.preventDefault();
    tocOpen = false;
  }

  function selectHeading(heading: Heading) {
    tocOpen = false;
    active = heading.id;
    requestedHeading = heading.id;
    clearTimeout(requestTimer);
    requestTimer = globalThis.setTimeout(() => (requestedHeading = ""), 1200);
  }

  /** 読み上げ用の状態はページで1つ。一定時間後に空にして、同じ文言も繰り返し伝わるようにする。 */
  let statusTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  function report(message: string) {
    status = message;
    clearTimeout(statusTimer);
    statusTimer = globalThis.setTimeout(
      () => (status = ""),
      Math.max(2400, motionDuration("status")),
    );
  }

  onMount(() => {
    enhancementsReady = true;
    const prose = root ?? document.querySelector<HTMLElement>(".prose");
    if (!prose) return;
    const headingElements = [...prose.querySelectorAll<HTMLElement>("h2[id], h3[id]")];
    if (!suppliedHeadings.length) {
      discoveredHeadings = headingElements.map((heading) => ({
        id: heading.id,
        text: heading.textContent?.replace("#", "").trim() ?? "",
        level: Number(heading.tagName.slice(1)),
      }));
    }
    active = headingElements[0]?.id ?? "";

    const stops = [
      observeComposition(prose, headingElements, composition, (value) => (measured = value)),
      enhanceCodeBlocks(prose, report),
      trackReadingPosition(prose, headingElements, {
        requested: () => requestedHeading,
        onChange: (state) => {
          progress = state.progress;
          active = state.active;
        },
      }),
    ];
    const tocObserver = new ResizeObserver(() => void updateToc());
    if (desktopTocList) tocObserver.observe(desktopTocList);
    stops.push(() => tocObserver.disconnect());

    // 図の描画・配色・拡大表示は図のある記事でだけ読み込む。
    let disposed = false;
    if (prose.querySelector(".mermaid-source")) {
      void import("./diagrams/mermaid-diagrams.ts").then(({ enhanceDiagrams }) => {
        if (!disposed) stops.push(enhanceDiagrams(prose, report));
      });
    }

    return () => {
      disposed = true;
      for (const stop of stops.reverse()) stop();
      clearTimeout(statusTimer);
      clearTimeout(requestTimer);
    };
  });

  const tocTriggerClass =
    "mobile-toc-trigger group/toc flex w-full min-h-(--control-size) cursor-pointer list-none items-center justify-start gap-(--space-2) border border-t-0 border-rule bg-(--color-glass) px-(--space-4) font-sans text-small tracking-ui text-ink backdrop-blur-glass pressable [--press-scale:1] [--press-shift:0px] rounded-b-none transition-[border-radius] duration-(--motion-duration-fast) ease-signature data-[state=closed]:rounded-b-ui-large data-[state=closed]:duration-(--motion-duration-fast) data-[state=closed]:delay-(--motion-duration-base) [details:not([open])>&]:rounded-b-ui-large motion-off:transition-none [&::-webkit-details-marker]:hidden";
  /** 目次の縦罫と、その上を動く追従バー。位置は --toc-marker-y / --toc-marker-height で渡す。 */
  const markerRail =
    "toc-list relative m-0 list-none before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:bg-rule before:content-[''] after:absolute after:top-0 after:left-0 after:h-(--toc-marker-height) after:w-0.5 after:transform-[translateY(var(--toc-marker-y))] after:bg-ink after:content-[''] after:transition-[height,transform] after:duration-(--motion-duration-micro) after:ease-enter motion-off:after:duration-(--motion-duration-immediate)";
</script>

{#snippet tocGlyph()}
  <!--
    線の左端を枠の左端に合わせる（flush）。枠を小さくすると線まで短くなるので、
    線の長さが元と変わらない寸法にしたうえで高さだけ本文に寄せる。
  -->
  <span
    class="grid size-[1.375em] shrink-0 transition-transform duration-(--motion-duration-base) ease-signature group-active/toc:translate-x-[0.14em] motion-off:transition-none [&>svg]:size-full"
  >
    <IndexGlyph flush />
  </span>
{/snippet}

<!--
  目次の項目は沈ませない。aside が overflow-auto なので、最後の項目が 1px 下がるだけで
  はみ出し領域が伸びてスクロールバーが出る。押下の応答は色だけで返す。
-->
{#snippet tocItems()}
  {#each headings as heading}
    <li class={cn("relative z-(--z-content) flex min-h-(--control-size) items-center in-[.desktop-toc]:min-h-(--space-8)", heading.level === 3 && "pl-(--space-3)")}>
      <a
        href={"#" + heading.id}
        aria-current={active === heading.id ? "location" : undefined}
        class="flex size-full min-w-0 items-center text-small leading-ui text-quiet no-underline pressable [--press-scale:1] [--press-shift:0px] aria-[current=location]:text-ink"
        onclick={() => selectHeading(heading)}
      >
        <span>{heading.text}</span>
      </a>
    </li>
  {/each}
{/snippet}

<svelte:window onkeydown={dismissToc} />

<div
  class="reading-progress pointer-events-none fixed top-0 left-0 z-(--z-progress) h-0.5 w-full"
  role="progressbar"
  aria-label="読了進捗"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={Math.round(progress)}
>
  <span class="block h-full w-(--reading-progress) bg-signal" style={`--reading-progress:${progress}%`}></span>
</div>

<p class="absolute size-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)]" aria-live="polite">{status}</p>

{#if headings.length || tools}
<div class={cn(
  "sticky top-[calc(var(--site-header-block)+var(--space-3))] grid gap-y-(--space-6) self-start max-read:static max-read:gap-y-0 read-wide:top-(--article-anchor-offset)",
  "read:max-read-wide:col-start-2 read:max-read-wide:row-start-1 read:max-read-wide:row-span-2",
  "read:max-h-[calc(100dvh-var(--site-header-block)-var(--space-6))] read-wide:max-h-[calc(100dvh-var(--article-anchor-offset)-var(--space-6))]",
  headings.length > 0 && "read-wide:grid-rows-[minmax(0,1fr)_auto]",
)}>
{#if headings.length}
  <aside class="desktop-toc min-h-0 overflow-auto pl-(--space-2) max-read-wide:hidden" aria-label="目次" data-ready={enhancementsReady}>
    <p class="mb-(--space-4) border-b border-rule pb-(--space-2) font-sans text-caption tracking-label text-quiet">目次</p>
    <div class="relative">
      {#if shownComposition}
        <span class="pointer-events-none absolute top-0 bottom-0 left-0 z-(--z-base) w-12"><ArticleCompositionGraph composition={shownComposition} {spans} id="detail-toc" /></span>
      {/if}
      <ol
        class={cn(markerRail, "grid grid-rows-(--toc-rows) pl-(--space-16)")}
        bind:this={desktopTocList}
        style={`--toc-marker-y:${desktopMarker.y}px;--toc-marker-height:${desktopMarker.height}px;--toc-rows:${tocRows}`}
      >
        {@render tocItems()}
      </ol>
    </div>
  </aside>
{/if}

  {#if tools}
    <div class="@container max-read:hidden">{@render tools()}</div>
  {/if}
</div>
{/if}

{#if headings.length}

  <div
    class="mobile-toc-region pointer-events-none relative z-(--z-overlay) hidden w-full max-read-wide:col-start-1 max-read-wide:row-start-1 max-read-wide:block max-read-wide:sticky max-read-wide:top-(--site-header-block) max-read-wide:-mt-section max-read-wide:pb-(--space-2) **:pointer-events-auto"
    data-ready={enhancementsReady}
  >
    <Collapsible.Root
      class="mobile-toc mobile-toc-js relative hidden in-data-[ready=true]:block"
      open={tocOpen}
      onOpenChange={(next) => (tocOpen = next)}
    >
      <Collapsible.Trigger class={tocTriggerClass}>
        {@render tocGlyph()}<span>目次</span>
      </Collapsible.Trigger>
      <Collapsible.Content class="mobile-toc-content absolute top-full left-0 z-(--z-overlay) w-full origin-top-left overflow-hidden rounded-b-ui-large border border-t-0 border-rule bg-(--color-glass) shadow-ui-overlay backdrop-blur-glass data-[state=open]:animate-toc-open data-[state=closed]:animate-toc-close motion-off:animate-none">
        <nav class="p-(--space-3) pb-(--radius-large)" aria-label="目次">
          <ol
            class={cn(markerRail, "pl-(--space-3)")}
            bind:this={mobileTocList}
            style={`--toc-marker-y:${mobileMarker.y}px;--toc-marker-height:${mobileMarker.height}px`}
          >{@render tocItems()}</ol>
        </nav>
      </Collapsible.Content>
    </Collapsible.Root>

    <details class="mobile-toc hidden border-b border-rule in-data-[ready=false]:block">
      <summary class={tocTriggerClass}>
        {@render tocGlyph()}<span>目次</span>
      </summary>
      <nav class="pb-(--space-3)" aria-label="目次"><ol class="m-0 list-none border-l border-rule pl-(--space-3)">{@render tocItems()}</ol></nav>
    </details>
  </div>
{/if}
