<script lang="ts">
  import { onMount } from "svelte";

  type Heading = { id: string; text: string; level: number };

  let {
    root,
    headings: suppliedHeadings = []
  }: {
    root?: HTMLElement | null;
    headings?: Heading[];
  } = $props();
  let discoveredHeadings = $state<Heading[]>([]);
  const headings = $derived(suppliedHeadings.length ? suppliedHeadings : discoveredHeadings);
  let active = $state("");
  let progress = $state(0);
  let copyStatus = $state("");

  function statusDuration(): number {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--motion-duration-status")
      .trim();
    const duration = Number.parseFloat(value);
    if (!Number.isFinite(duration)) return 0;
    return value.endsWith("ms") ? duration : value.endsWith("s") ? duration * 1000 : duration;
  }

  onMount(() => {
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

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
        (entries) => {
          const visible = entries.find((entry) => entry.isIntersecting);
          if (visible) active = visible.target.id;
        },
        { rootMargin: "-20% 0px -70% 0px" },
      );
    headingElements.forEach((heading) => observer?.observe(heading));

    const buttons: HTMLButtonElement[] = [];
    prose.querySelectorAll<HTMLElement>(".code-block").forEach((block) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "コードをコピー");
      button.addEventListener("click", async () => {
        const code = block.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = "Copied";
          button.setAttribute("aria-label", "コードをコピーしました");
          copyStatus = "コードをコピーしました";
        } catch {
          button.textContent = "Copy failed";
          button.setAttribute("aria-label", "コードをコピーできませんでした");
          copyStatus = "コードをコピーできませんでした";
        }
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.setAttribute("aria-label", "コードをコピー");
        }, statusDuration());
      });
      block.append(button);
      buttons.push(button);
    });

    const renderMermaid = async () => {
      const sources = [...prose.querySelectorAll<HTMLElement>(".mermaid-source")];
      if (!sources.length) return;
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: document.documentElement.dataset.theme === "dark" ? "dark" : "neutral",
      });
      for (const [index, source] of sources.entries()) {
        const graph = source.textContent ?? "";
        const title = source.dataset.title ?? "Mermaid diagram";
        try {
          const { svg } = await mermaid.render(`mermaid-${index}-${Date.now()}`, graph);
          const figure = document.createElement("figure");
          figure.className = "mermaid-diagram";
          figure.setAttribute("role", "img");
          figure.setAttribute("aria-label", title);
          figure.innerHTML = svg;
          const diagram = figure.querySelector<SVGSVGElement>("svg");
          diagram?.setAttribute("aria-hidden", "true");
          if (source.dataset.title) {
            const caption = document.createElement("figcaption");
            caption.textContent = source.dataset.title;
            figure.append(caption);
          }
          source.replaceWith(figure);
          const graphElement = diagram?.querySelector<SVGGElement>(":scope > g");
          if (diagram && graphElement) {
            const box = graphElement.getBBox();
            // design-literal: padding is in Mermaid's generated SVG coordinate system.
            const padding = 8;
            diagram.setAttribute(
              "viewBox",
              `${box.x - padding} ${box.y - padding} ${box.width + 2 * padding} ${
                box.height + 2 * padding
              }`,
            );
          }
        } catch {
          source.setAttribute("aria-label", `${title}を表示できませんでした`);
        }
      }
    };
    void renderMermaid();

    const updateProgress = () => {
      const rect = prose.getBoundingClientRect();
      const available = rect.height - window.innerHeight;
      progress = available <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / available) * 100));
    };
    updateProgress();
    addEventListener("scroll", updateProgress, { passive: true });
    addEventListener("resize", updateProgress);

    return () => {
      observer?.disconnect();
      buttons.forEach((button) => button.remove());
      removeEventListener("scroll", updateProgress);
      removeEventListener("resize", updateProgress);
    };
  });
</script>

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
  <aside class="desktop-toc" aria-label="目次">
    <p>On this page</p>
    <ol>
      {#each headings as heading}
        <li class:sub={heading.level === 3}>
          <a href={"#" + heading.id} aria-current={active === heading.id ? "location" : undefined}>
            {heading.text}
          </a>
        </li>
      {/each}
    </ol>
  </aside>
  <details class="mobile-toc">
    <summary>On this page</summary>
    <nav aria-label="目次">
      <ol>
        {#each headings as heading}
          <li class:sub={heading.level === 3}>
            <a href={"#" + heading.id} aria-current={active === heading.id ? "location" : undefined}>
              {heading.text}
            </a>
          </li>
        {/each}
      </ol>
    </nav>
  </details>
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
    top: 7rem;
    align-self: start;
    max-height: calc(100vh - 9rem);
    overflow: auto;
    border-left: 1px solid var(--color-line);
    padding-left: var(--space-5);
  }

  .mobile-toc { display: none; }

  aside p {
    margin: 0 0 var(--space-4);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    margin-block: var(--space-2);
  }

  li.sub {
    padding-left: var(--space-3);
  }

  a {
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
    min-width: 4rem;
    min-height: 2rem;
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    cursor: pointer;
  }

  :global(.mermaid-diagram) {
    overflow-x: auto;
    margin: var(--space-8) 0;
    border: 1px solid var(--color-line);
    padding: var(--space-6);
    background: var(--color-surface);
  }

  :global(.mermaid-diagram figcaption) {
    margin-top: var(--space-3);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  :global(.mermaid-diagram svg) {
    width: 100%;
    height: auto;
  }

  @media (max-width: 60rem) {
    .desktop-toc { display: none; }
    .mobile-toc {
      display: block;
      grid-row: 1;
      border: 1px solid var(--color-line);
      padding: var(--space-4);
    }
    .mobile-toc summary { cursor: pointer; font-family: var(--font-mono); font-size: var(--text-caption); letter-spacing: var(--tracking-label); text-transform: uppercase; }
    .mobile-toc nav { margin-top: var(--space-4); }
  }

  @media (max-width: 44rem) {
    .mobile-toc { padding: var(--space-3); }
  }
</style>
