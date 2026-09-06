<script module lang="ts">
  let sharedMermaidQueue: Promise<void> = Promise.resolve();
  let mermaidRenderId = 0;
</script>

<script lang="ts">
  import { onMount, tick } from "svelte";
  import { announceHeaderDisclosure, listenForHeaderDisclosure } from "../components/header-disclosures.ts";
  import { IndexGlyph } from "../icons/index.ts";
  import * as Collapsible from "../primitives/collapsible";
  import ArticleCompositionGraph from "../visuals/ArticleCompositionGraph.svelte";
  import type { ArticleCompositionVisual } from "../visuals/article-composition-types.ts";
  import { cn } from "../utils.ts";

  type Heading = { id: string; text: string; level: number };
  type DiagramRecord = {
    source: HTMLElement;
    graph: string;
    title: string;
    figure?: HTMLElement;
  };

  let {
    root,
    headings: suppliedHeadings = [],
    composition,
  }: {
    root?: HTMLElement | null;
    headings?: Heading[];
    composition?: ArticleCompositionVisual;
  } = $props();
  let discoveredHeadings = $state<Heading[]>([]);
  const headings = $derived(
    suppliedHeadings.length ? suppliedHeadings : discoveredHeadings,
  );
  // Source estimates render first; measured heights replace them once the prose is laid out.
  let measured = $state<ArticleCompositionVisual | undefined>(undefined);
  const shownComposition = $derived(measured ?? composition);
  const tocRows = $derived(
    headings.map((heading) => `minmax(min-content, ${shownComposition?.sections.find((section) => section.id === heading.id)?.units ?? 1}fr)`).join(" "),
  );
  let active = $state("");
  let progress = $state(0);
  let copyStatus = $state("");
  let tocOpen = $state(false);
  let enhancementsReady = $state(false);
  let desktopTocList = $state<HTMLOListElement | null>(null);
  let mobileTocList = $state<HTMLOListElement | null>(null);
  let tocMarkerY = $state(0);
  let tocMarkerHeight = $state(0);
  let mobileMarkerY = $state(0);
  let mobileMarkerHeight = $state(0);
  let requestedHeading = "";
  let requestedHeadingTimeout:
    | ReturnType<typeof globalThis.setTimeout>
    | undefined;

  function activeRow(list: HTMLOListElement | null): HTMLLIElement | null {
    return list?.querySelector<HTMLAnchorElement>('a[aria-current="location"]')
      ?.closest<HTMLLIElement>("li") ?? null;
  }

  async function updateTocMarker() {
    await tick();
    const desktopRow = activeRow(desktopTocList);
    if (desktopRow) {
      tocMarkerY = desktopRow.offsetTop;
      tocMarkerHeight = desktopRow.offsetHeight;
    }
    const mobileRow = activeRow(mobileTocList);
    if (mobileRow) {
      mobileMarkerY = mobileRow.offsetTop;
      mobileMarkerHeight = mobileRow.offsetHeight;
    }
  }

  $effect(() => {
    active;
    tocOpen;
    void updateTocMarker();
  });

  // The contents share the Header disclosure channel, so only one panel is open at a time.
  $effect(() => {
    if (tocOpen) announceHeaderDisclosure("toc");
  });

  function dismissToc(event: KeyboardEvent) {
    if (event.key !== "Escape" || !tocOpen) return;
    event.preventDefault();
    tocOpen = false;
  }

  function statusDuration(): number {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--motion-duration-status")
      .trim();
    const duration = Number.parseFloat(value);
    if (!Number.isFinite(duration)) return 0;
    return value.endsWith("ms")
      ? duration
      : value.endsWith("s")
        ? duration * 1000
        : duration;
  }

  onMount(() => {
    enhancementsReady = true;
    const stopDisclosure = listenForHeaderDisclosure("toc", () => (tocOpen = false));
    const prose = root ?? document.querySelector<HTMLElement>(".prose");
    if (!prose) return stopDisclosure;
    const headingElements = [
      ...prose.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    ];
    if (!headings.length) {
      discoveredHeadings = headingElements.map((heading) => ({
        id: heading.id,
        text: heading.textContent?.replace("#", "").trim() ?? "",
        level: Number(heading.tagName.slice(1)),
      }));
    }
    active = headingElements[0]?.id ?? "";

    const measureComposition = () => {
      const total = prose.getBoundingClientRect().height;
      if (!total) return;
      const base = prose.getBoundingClientRect().top + globalThis.scrollY;
      const blocks: Array<{
        kind: "text" | "technical" | "media";
        start: number;
        end: number;
        units: number;
        characters: number;
      }> = [];
      for (const child of [...prose.children] as HTMLElement[]) {
        const rect = child.getBoundingClientRect();
        if (child.hidden || rect.height <= 0) continue;
        const kind = child.matches("figure, picture, img, .mermaid-diagram, .link-card")
          ? "media"
          : child.matches("pre, table, .code-block, .katex-display") ||
              child.querySelector(".katex-display")
          ? "technical"
          : "text";
        const start = rect.top + globalThis.scrollY - base;
        const end = start + rect.height;
        const previous = blocks.at(-1);
        if (previous && previous.kind === kind) {
          previous.end = end;
          previous.characters += child.textContent?.length ?? 0;
          continue;
        }
        blocks.push({ kind, start, end, units: 0, characters: child.textContent?.length ?? 0 });
      }
      const sections = headingElements.map((heading, index) => {
        const start = heading.getBoundingClientRect().top + globalThis.scrollY - base;
        const next = headingElements[index + 1];
        return {
          id: heading.id,
          start,
          end: next ? next.getBoundingClientRect().top + globalThis.scrollY - base : total,
          units: 0,
        };
      });
      const normalize = <T extends { start: number; end: number; units: number }>(item: T) => {
        item.units = Math.max(0, item.end - item.start);
        item.start = Math.min(1, Math.max(0, item.start / total));
        item.end = Math.min(1, Math.max(0, item.end / total));
        return item;
      };
      measured = {
        estimatedMinutes: composition?.estimatedMinutes ?? 0,
        textCharacters: composition?.textCharacters ?? 0,
        paperLayers: composition?.paperLayers ?? 1,
        blocks: blocks.map(normalize),
        sections: sections.map(normalize),
      };
    };
    let measureFrame = 0;
    const scheduleMeasure = () => {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        measureComposition();
      });
    };
    const proseResizeObserver = new ResizeObserver(scheduleMeasure);
    proseResizeObserver.observe(prose);
    scheduleMeasure();

    const buttons: HTMLButtonElement[] = [];
    prose.querySelectorAll<HTMLElement>(".code-block").forEach((block) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.dataset.cursor = "interactive";
      button.dataset.cursorLabel = "Copy code";
      button.setAttribute("aria-label", "コードをコピー");
      button.addEventListener("click", async () => {
        const code = block.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          button.dataset.copied = "true";
          button.setAttribute("aria-label", "コードをコピーしました");
          copyStatus = "コードをコピーしました";
        } catch {
          button.dataset.failed = "true";
          button.setAttribute("aria-label", "コードをコピーできませんでした");
          copyStatus = "コードをコピーできませんでした";
        }
        window.setTimeout(() => {
          delete button.dataset.copied;
          delete button.dataset.failed;
          button.setAttribute("aria-label", "コードをコピー");
        }, statusDuration());
      });
      block.append(button);
      buttons.push(button);
    });

    const diagrams: DiagramRecord[] = [
      ...prose.querySelectorAll<HTMLElement>(".mermaid-source"),
    ].map((source) => ({
      source,
      graph: source.textContent ?? "",
      title: source.dataset.title ?? "Mermaid diagram",
    }));
    let mermaidGeneration = 0;
    const renderMermaid = async () => {
      if (!diagrams.length) return;
      const generation = ++mermaidGeneration;
      const theme =
        document.documentElement.dataset.theme === "dark" ? "dark" : "neutral";
      sharedMermaidQueue = sharedMermaidQueue
        .catch(() => undefined)
        .then(async () => {
          if (generation !== mermaidGeneration) return;
          const { default: mermaid } = await import("mermaid");
          if (generation !== mermaidGeneration) return;
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme,
          });
          const rendered: Array<HTMLElement | null> = [];
          for (const record of diagrams) {
            try {
              const { svg } = await mermaid.render(
                `mermaid-${++mermaidRenderId}`,
                record.graph,
              );
              const figure = document.createElement("figure");
              figure.className = "mermaid-diagram";
              figure.setAttribute("role", "img");
              // The figure scrolls horizontally, so it must be reachable from the keyboard.
              figure.setAttribute("tabindex", "0");
              figure.setAttribute("aria-label", record.title);
              figure.innerHTML = svg;
              const drawing = figure.querySelector("svg");
              drawing?.setAttribute("aria-hidden", "true");
              // Below nine tenths of its authored width the labels stop being readable,
              // so the figure scrolls from there instead of shrinking further.
              const authored = drawing?.viewBox?.baseVal?.width ?? 0;
              if (authored) {
                figure.style.setProperty(
                  "--mermaid-legible-width",
                  `${Math.round(authored * 0.9)}px`,
                );
              }
              if (record.source.dataset.title) {
                const caption = document.createElement("figcaption");
                caption.textContent = record.source.dataset.title;
                figure.append(caption);
              }
              rendered.push(figure);
            } catch {
              rendered.push(null);
            }
          }
          if (generation !== mermaidGeneration) return;
          diagrams.forEach((record, index) => {
            const figure = rendered[index];
            if (figure) {
              if (record.figure) record.figure.replaceWith(figure);
              else record.source.after(figure);
              record.figure = figure;
              record.source.hidden = true;
              record.source.removeAttribute("aria-label");
              return;
            }
            if (record.figure) {
              record.source.hidden = true;
              return;
            }
            record.source.hidden = false;
            record.source.setAttribute(
              "aria-label",
              `${record.title}を表示できませんでした`,
            );
          });
        })
        .catch(() => {
          if (generation !== mermaidGeneration) return;
          diagrams.forEach((record) => {
            if (record.figure) return;
            record.source.hidden = false;
            record.source.setAttribute(
              "aria-label",
              `${record.title}を表示できませんでした`,
            );
          });
        });
      await sharedMermaidQueue;
    };
    void renderMermaid();
    const themeObserver = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === "data-theme"))
        void renderMermaid();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    let frame = 0;
    const updateReadingState = () => {
      frame = 0;
      const rect = prose.getBoundingClientRect();
      const available = rect.height - window.innerHeight;
      progress =
        available <= 0
          ? 100
          : Math.min(100, Math.max(0, (-rect.top / available) * 100));
      const offset = headingElements[0]
        ? Number.parseFloat(
            getComputedStyle(headingElements[0]).scrollMarginTop,
          ) || 0
        : 0;
      if (requestedHeading) {
        active = requestedHeading;
        return;
      }
      let current = headingElements[0]?.id ?? "";
      for (const heading of headingElements) {
        if (heading.getBoundingClientRect().top <= offset + 1)
          current = heading.id;
        else break;
      }
      active = current;
    };
    const scheduleReadingState = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateReadingState);
    };
    updateReadingState();
    addEventListener("scroll", scheduleReadingState, { passive: true });
    addEventListener("resize", scheduleReadingState);
    const tocResizeObserver = new ResizeObserver(() => void updateTocMarker());
    if (desktopTocList) tocResizeObserver.observe(desktopTocList);

    return () => {
      stopDisclosure();
      mermaidGeneration += 1;
      themeObserver.disconnect();
      tocResizeObserver.disconnect();
      proseResizeObserver.disconnect();
      if (measureFrame) cancelAnimationFrame(measureFrame);
      if (frame) cancelAnimationFrame(frame);
      buttons.forEach((button) => button.remove());
      diagrams.forEach((record) => record.figure?.remove());
      removeEventListener("scroll", scheduleReadingState);
      removeEventListener("resize", scheduleReadingState);
      if (requestedHeadingTimeout !== undefined)
        clearTimeout(requestedHeadingTimeout);
    };
  });

  const tocTriggerClass =
    "mobile-toc-trigger inline-flex min-h-(--control-size) cursor-pointer list-none items-center justify-start gap-(--space-2) border-0 bg-ink px-(--space-3) font-sans text-small tracking-ui text-canvas [&::-webkit-details-marker]:hidden";

  function selectHeading(heading: Heading) {
    tocOpen = false;
    active = heading.id;
    requestedHeading = heading.id;
    if (requestedHeadingTimeout !== undefined)
      clearTimeout(requestedHeadingTimeout);
    requestedHeadingTimeout = globalThis.setTimeout(() => {
      requestedHeading = "";
    }, 1200);
  }
</script>

{#snippet tocGlyph()}
  <IndexGlyph class="shrink-0" />
{/snippet}

{#snippet tocItems()}
  {#each headings as heading}
    <li class={cn("relative z-(--z-content) flex min-h-(--control-size) items-center [.desktop-toc_&]:min-h-(--space-8)", heading.level === 3 && "pl-(--space-3)")}>
      <a
        href={"#" + heading.id}
        aria-current={active === heading.id ? "location" : undefined}
        class="block text-small leading-ui text-quiet no-underline aria-[current=location]:text-ink"
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

<p class="copy-status absolute size-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)]" aria-live="polite">{copyStatus}</p>

{#if headings.length}
  <aside class="desktop-toc sticky top-(--article-anchor-offset) max-h-[calc(100vh-var(--article-anchor-offset)-var(--space-4))] self-start overflow-auto pl-(--space-2) max-lg:hidden" aria-label="目次" data-ready={enhancementsReady}>
    <p class="mb-(--space-4) border-b border-rule pb-(--space-2) font-sans text-caption tracking-label text-quiet">目次</p>
    <div class="toc-composition relative">
      {#if shownComposition}
        <span class="pointer-events-none absolute top-0 bottom-0 left-0 z-(--z-base) w-12"><ArticleCompositionGraph composition={shownComposition} id="detail-toc" orientation="vertical" /></span>
      {/if}
      <ol
        class="toc-list relative m-0 grid min-h-[max(calc(var(--toc-count)*var(--space-10)),22vh)] grid-rows-(--toc-rows) list-none pl-(--space-16) before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:bg-rule before:content-[''] after:absolute after:top-0 after:left-0 after:h-(--toc-marker-height) after:w-0.5 after:transform-[translateY(var(--toc-marker-y))] after:bg-ink after:content-[''] after:transition-[height,transform] after:duration-(--motion-duration-micro) after:ease-enter motion-reduced:after:duration-(--motion-duration-immediate) motion-off:after:duration-(--motion-duration-immediate)"
        bind:this={desktopTocList}
        style={`--toc-marker-y:${tocMarkerY}px;--toc-marker-height:${tocMarkerHeight}px;--toc-rows:${tocRows};--toc-count:${headings.length}`}
      >
        {@render tocItems()}
      </ol>
    </div>
  </aside>

  <div
    class="mobile-toc-region hidden max-lg:block data-[ready=true]:fixed data-[ready=true]:top-[calc(env(safe-area-inset-top)+var(--layout-gutter))] data-[ready=true]:left-[calc(env(safe-area-inset-left)+var(--layout-gutter))] data-[ready=true]:z-(--z-header) max-lg:row-start-1"
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
      <Collapsible.Content class="mobile-toc-content absolute top-[calc(100%+var(--space-2))] left-0 z-(--z-overlay) w-[min(20rem,calc(100vw-2*var(--layout-gutter)))] origin-top-left overflow-hidden border border-rule bg-(--color-glass-solid) p-(--space-3) shadow-ui-overlay backdrop-blur-glass data-[state=open]:animate-disclosure-in data-[state=closed]:animate-disclosure-out motion-reduced:animate-none motion-off:animate-none">
        <nav aria-label="目次">
          <ol
            class="toc-list relative m-0 list-none pl-(--space-3) before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:bg-rule before:content-[''] after:absolute after:top-0 after:left-0 after:h-(--toc-marker-height) after:w-0.5 after:transform-[translateY(var(--toc-marker-y))] after:bg-ink after:content-[''] after:transition-[height,transform] after:duration-(--motion-duration-micro) after:ease-enter motion-reduced:after:duration-(--motion-duration-immediate) motion-off:after:duration-(--motion-duration-immediate)"
            bind:this={mobileTocList}
            style={`--toc-marker-y:${mobileMarkerY}px;--toc-marker-height:${mobileMarkerHeight}px`}
          >{@render tocItems()}</ol>
        </nav>
      </Collapsible.Content>
    </Collapsible.Root>

    <details class="mobile-toc mobile-toc-no-js hidden border-b border-rule in-data-[ready=false]:block">
      <summary class={tocTriggerClass}>
        {@render tocGlyph()}<span>目次</span>
      </summary>
      <nav class="pb-(--space-3)" aria-label="目次"><ol class="m-0 list-none border-l border-rule pl-(--space-3)">{@render tocItems()}</ol></nav>
    </details>
  </div>
{/if}
