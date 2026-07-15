<script lang="ts">
  import { onMount } from "svelte";

  type Heading = { id: string; text: string; level: number };
  let headings = $state<Heading[]>([]);
  let active = $state("");
  let progress = $state(0);

  onMount(() => {
    const prose = document.querySelector<HTMLElement>(".prose");
    if (!prose) return;
    const headingElements = [...prose.querySelectorAll<HTMLElement>("h2[id], h3[id]")];
    headings = headingElements.map((heading) => ({
      id: heading.id,
      text: heading.textContent?.replace("#", "").trim() ?? "",
      level: Number(heading.tagName.slice(1))
    }));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) active = visible.target.id;
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headingElements.forEach((heading) => observer.observe(heading));

    const buttons: HTMLButtonElement[] = [];
    prose.querySelectorAll<HTMLElement>(".code-block").forEach((block) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "コードをコピー");
      button.addEventListener("click", async () => {
        const code = block.querySelector("code")?.textContent ?? "";
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        window.setTimeout(() => (button.textContent = "Copy"), 1500);
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
        theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "neutral"
      });
      for (const [index, source] of sources.entries()) {
        const graph = source.textContent ?? "";
        try {
          const { svg } = await mermaid.render("mermaid-" + index + "-" + Date.now(), graph);
          const figure = document.createElement("figure");
          figure.className = "mermaid-diagram";
          figure.innerHTML = svg;
          source.replaceWith(figure);
        } catch {
          source.setAttribute("aria-label", "Mermaid図を表示できませんでした");
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
      observer.disconnect();
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

{#if headings.length}
  <aside aria-label="目次">
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
{/if}

<style>
  .reading-progress {
    position: fixed;
    z-index: 40;
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

  aside {
    position: sticky;
    top: 7rem;
    align-self: start;
    max-height: calc(100vh - 9rem);
    overflow: auto;
    border-left: 1px solid var(--color-line);
    padding-left: var(--space-5);
  }

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
    line-height: 1.5;
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

  @media (max-width: 60rem) {
    aside {
      position: static;
      grid-row: 1;
      max-height: 12rem;
      overflow: auto;
      border: 1px solid var(--color-line);
      padding: var(--space-4);
    }
  }

  @media (max-width: 44rem) {
    aside {
      max-height: 10rem;
    }
  }
</style>
