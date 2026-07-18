<script module lang="ts">
  let sharedMermaidQueue: Promise<void> = Promise.resolve();
  let mermaidRenderId = 0;
</script>

<script lang="ts">
  import { onMount, tick } from "svelte";
  import * as Collapsible from "../primitives/collapsible";

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
  }: {
    root?: HTMLElement | null;
    headings?: Heading[];
  } = $props();
  let discoveredHeadings = $state<Heading[]>([]);
  const headings = $derived(suppliedHeadings.length ? suppliedHeadings : discoveredHeadings);
  let active = $state("");
  let progress = $state(0);
  let copyStatus = $state("");
  let tocOpen = $state(false);
  let enhancementsReady = $state(false);
  let desktopTocList = $state<HTMLOListElement | null>(null);
  let tocMarkerY = $state(0);
  let tocMarkerHeight = $state(0);
  let requestedHeading = "";
  let requestedHeadingTimeout: ReturnType<typeof globalThis.setTimeout> | undefined;

  async function updateTocMarker() {
    await tick();
    const current = desktopTocList?.querySelector<HTMLAnchorElement>(
      'a[aria-current="location"]',
    );
    if (!current) return;
    tocMarkerY = current.offsetTop;
    tocMarkerHeight = current.offsetHeight;
  }

  $effect(() => {
    active;
    void updateTocMarker();
  });

  function statusDuration(): number {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--motion-duration-status")
      .trim();
    const duration = Number.parseFloat(value);
    if (!Number.isFinite(duration)) return 0;
    return value.endsWith("ms") ? duration : value.endsWith("s") ? duration * 1000 : duration;
  }

  onMount(() => {
    enhancementsReady = true;
    const prose = root ?? document.querySelector<HTMLElement>(".prose");
    if (!prose) return;
    const headingElements = [...prose.querySelectorAll<HTMLElement>("h2[id], h3[id]")];
    if (!headings.length) {
      discoveredHeadings = headingElements.map((heading) => ({
        id: heading.id,
        text: heading.textContent?.replace("#", "").trim() ?? "",
        level: Number(heading.tagName.slice(1)),
      }));
    }
    active = headingElements[0]?.id ?? "";

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
      const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "neutral";
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
              figure.setAttribute("aria-label", record.title);
              figure.innerHTML = svg;
              figure.querySelector("svg")?.setAttribute("aria-hidden", "true");
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
      if (records.some((record) => record.attributeName === "data-theme")) void renderMermaid();
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
      progress = available <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / available) * 100));
      const offset = headingElements[0]
        ? Number.parseFloat(getComputedStyle(headingElements[0]).scrollMarginTop) || 0
        : 0;
      if (requestedHeading) {
        active = requestedHeading;
        return;
      }
      let current = headingElements[0]?.id ?? "";
      for (const heading of headingElements) {
        if (heading.getBoundingClientRect().top <= offset + 1) current = heading.id;
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
    const finishRequestedHeading = () => {
      if (requestedHeading) active = requestedHeading;
      requestedHeading = "";
    };
    addEventListener("scrollend", finishRequestedHeading);

    return () => {
      mermaidGeneration += 1;
      themeObserver.disconnect();
      tocResizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      buttons.forEach((button) => button.remove());
      diagrams.forEach((record) => record.figure?.remove());
      removeEventListener("scroll", scheduleReadingState);
      removeEventListener("resize", scheduleReadingState);
      removeEventListener("scrollend", finishRequestedHeading);
      if (requestedHeadingTimeout !== undefined) clearTimeout(requestedHeadingTimeout);
    };
  });

  function selectHeading(heading: Heading) {
    active = heading.id;
    requestedHeading = heading.id;
    if (requestedHeadingTimeout !== undefined) clearTimeout(requestedHeadingTimeout);
    requestedHeadingTimeout = globalThis.setTimeout(() => {
      requestedHeading = "";
    }, 1200);
  }
</script>

{#snippet tocItems()}
  {#each headings as heading}
    <li class:sub={heading.level === 3}>
      <a
        href={"#" + heading.id}
        aria-current={active === heading.id ? "location" : undefined}
        onclick={() => selectHeading(heading)}
      >
        <span>{heading.text}</span>
      </a>
    </li>
  {/each}
{/snippet}

<div
  class="reading-progress"
  role="progressbar"
  aria-label="読了進捗"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={Math.round(progress)}
>
  <span style:width={progress + "%"}></span>
</div>

<p class="copy-status" aria-live="polite">{copyStatus}</p>

{#if headings.length}
  <aside class="desktop-toc" aria-label="目次" data-ready={enhancementsReady}>
    <p>On this page</p>
    <ol
      class="toc-list"
      bind:this={desktopTocList}
      style={`--toc-marker-y: ${tocMarkerY}px; --toc-marker-height: ${tocMarkerHeight}px;`}
    >{@render tocItems()}</ol>
  </aside>

  <div class="mobile-toc-region" data-ready={enhancementsReady}>
    <Collapsible.Root
      class="mobile-toc mobile-toc-js"
      open={tocOpen}
      onOpenChange={(next) => tocOpen = next}
    >
      <Collapsible.Trigger class="mobile-toc-trigger">
        <span>On this page</span><i aria-hidden="true"></i>
      </Collapsible.Trigger>
      <Collapsible.Content class="mobile-toc-content">
        <nav aria-label="目次"><ol>{@render tocItems()}</ol></nav>
      </Collapsible.Content>
    </Collapsible.Root>

    <details class="mobile-toc mobile-toc-no-js">
      <summary>On this page</summary>
      <nav aria-label="目次"><ol>{@render tocItems()}</ol></nav>
    </details>
  </div>
{/if}

<style>
  .reading-progress {
    position: fixed;
    z-index: var(--z-progress);
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    pointer-events: none;
  }

  .reading-progress span {
    display: block;
    height: 100%;
    background: var(--color-accent);
  }

  .copy-status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  aside {
    position: sticky;
    top: var(--article-anchor-offset);
    align-self: start;
    max-height: calc(100vh - var(--article-anchor-offset) - var(--space-4));
    overflow: auto;
    padding-left: var(--space-2);
  }

  .mobile-toc { display: none; }
  .mobile-toc-region { display: none; }
  .mobile-toc-no-js { display: none; }

  aside p {
    margin: 0 0 var(--space-4);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc-list {
    position: relative;
    padding-left: var(--space-4);
  }

  .toc-list::before,
  .toc-list::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    background: var(--color-line);
    content: "";
  }

  .toc-list::after {
    bottom: auto;
    width: 2px;
    height: var(--toc-marker-height);
    background: var(--color-foreground);
    transform: translateY(var(--toc-marker-y));
    transition:
      height var(--motion-duration-micro) var(--motion-ease-enter),
      transform var(--motion-duration-micro) var(--motion-ease-enter);
  }

  li {
    margin-block: var(--space-2);
  }

  li.sub {
    padding-left: var(--space-3);
  }

  a {
    display: block;
    color: var(--color-muted);
    font-size: var(--text-caption);
    line-height: var(--leading-ui);
    text-decoration: none;
  }

  a[aria-current="location"] {
    color: var(--color-foreground);
  }

  :global(.code-copy) {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: grid;
    width: var(--space-8);
    min-height: var(--space-8);
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--color-code-foreground) 32%, transparent);
    padding: 0;
    background: var(--color-code-background);
    color: var(--color-code-foreground);
    cursor: pointer;
  }

  :global(.code-block[data-title] .code-copy) {
    top: calc((var(--space-10) - var(--space-8)) / 2);
  }

  :global(.code-copy::before),
  :global(.code-copy::after) {
    position: absolute;
    width: .55rem;
    height: .65rem;
    border: 1px solid currentColor;
    content: "";
  }

  :global(.code-copy::before) {
    transform: translate(-2px, 2px);
  }

  :global(.code-copy::after) {
    background: var(--color-code-background);
    transform: translate(2px, -2px);
  }

  :global(.code-copy[data-copied]::before) {
    width: .65rem;
    height: .35rem;
    border-width: 0 0 1px 1px;
    transform: rotate(-45deg);
  }

  :global(.code-copy[data-copied]::after),
  :global(.code-copy[data-failed]::after) {
    display: none;
  }

  :global(.code-copy[data-failed]) {
    color: var(--color-negative);
  }

  :global(.mermaid-diagram) {
    position: relative;
    z-index: calc(var(--z-controls) + 1);
    overflow-x: auto;
    margin: var(--space-8) 0;
    border: 1px solid var(--color-line);
    padding: var(--space-6);
    background: var(--color-surface);
  }

  :global(.mermaid-diagram figcaption) {
    margin-top: var(--space-3);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--text-caption);
  }

  :global(.mermaid-diagram svg) {
    width: 100%;
    height: auto;
  }

  @keyframes toc-open {
    from { height: 0; opacity: 0; }
    to { height: var(--bits-collapsible-content-height); opacity: 1; }
  }

  @keyframes toc-close {
    from { height: var(--bits-collapsible-content-height); opacity: 1; }
    to { height: 0; opacity: 0; }
  }

  @media (max-width: 60rem) {
    .desktop-toc { display: none; }
    .mobile-toc-region {
      display: block;
      grid-row: 1;
    }
    .mobile-toc-region[data-ready="true"] :global(.mobile-toc-js) { display: block; }
    .mobile-toc-region[data-ready="false"] .mobile-toc-no-js { display: block; }
    .mobile-toc {
      border: 1px solid var(--color-line);
      padding: var(--space-3);
      background: color-mix(in srgb, var(--color-glass) 74%, transparent);
      backdrop-filter: blur(var(--glass-blur));
    }
    :global(.mobile-toc-trigger),
    .mobile-toc summary {
      display: flex;
      width: 100%;
      min-height: var(--space-8);
      align-items: center;
      justify-content: space-between;
      border: 0;
      padding: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: var(--text-caption);
      letter-spacing: var(--tracking-label);
      text-transform: uppercase;
    }
    :global(.mobile-toc-trigger i) {
      width: var(--space-3);
      height: var(--space-3);
      border-right: 1px solid currentColor;
      border-bottom: 1px solid currentColor;
      transform: rotate(45deg);
      transition: transform var(--motion-duration-micro) var(--motion-ease-standard);
    }
    :global(.mobile-toc-trigger[data-state="open"] i) {
      transform: rotate(225deg);
    }
    :global(.mobile-toc-content) {
      overflow: hidden;
    }
    :global(.mobile-toc-content[data-state="open"]) {
      animation: toc-open var(--motion-duration-base) var(--motion-ease-enter);
    }
    :global(.mobile-toc-content[data-state="closed"]) {
      animation: toc-close var(--motion-duration-fast) var(--motion-ease-exit);
    }
    :global(.mobile-toc-content nav),
    .mobile-toc-no-js nav {
      padding-top: var(--space-3);
    }
    .mobile-toc a {
      display: block;
    }
  }

  :global(html[data-motion="reduced"]) .toc-list::after,
  :global(html[data-motion="off"]) .toc-list::after {
    transition-duration: var(--motion-duration-immediate);
  }

  :global(html[data-motion="reduced"]) :global(.mobile-toc-content),
  :global(html[data-motion="off"]) :global(.mobile-toc-content) {
    animation-duration: var(--motion-duration-immediate);
  }
</style>
