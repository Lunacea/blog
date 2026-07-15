<script lang="ts">
  import type { Content, ContentStatus, ContentType } from "@lunacea/schemas";
  import StatusBadge from "./StatusBadge.svelte";

  type ContentListEntry = {
    slug: string;
    type: ContentType;
    title: string;
    summary: string;
    tags: string[];
    publishedAt: string;
    status: ContentStatus;
  };

  let {
    entries,
    showType = false
  }: {
    entries: ContentListEntry[];
    showType?: boolean;
  } = $props();

  function href(entry: Pick<Content, "type" | "slug">): string {
    if (entry.type === "article") return "/articles/" + entry.slug;
    if (entry.type === "work") return "/works/" + entry.slug;
    if (entry.type === "talk") return "/talks/" + entry.slug;
    return "/archive/" + entry.type + "s/" + entry.slug;
  }
</script>

<ol class="content-list">
  {#each entries as entry}
    <li data-reveal="line">
      <a href={href(entry)}>
        <div class="meta">
          <time datetime={entry.publishedAt}>{entry.publishedAt}</time>
          {#if showType}<span>{entry.type}</span>{/if}
          <StatusBadge status={entry.status} />
        </div>
        <div class="copy">
          <h2 style:view-transition-name={`record-${entry.type}-${entry.slug}`}>{entry.title}</h2>
          <p>{entry.summary}</p>
          <ul class="tag-list" aria-label="タグ">
            {#each entry.tags.slice(0, 4) as tag}
              <li><span class="tag">{tag}</span></li>
            {/each}
          </ul>
        </div>
        <span class="arrow" aria-hidden="true">↗</span>
      </a>
    </li>
  {/each}
</ol>

<style>
  .content-list {
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--color-line);
    list-style: none;
  }

  .content-list > li {
    border-bottom: 1px solid var(--color-line);
  }

  .content-list > li > a {
    display: grid;
    grid-template-columns: 11rem 1fr auto;
    gap: clamp(var(--space-4), 5vw, var(--space-16));
    padding: clamp(var(--space-6), 4vw, var(--space-10)) var(--space-3);
    text-decoration: none;
    transition: background var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .content-list > li > a:hover,
  .content-list > li > a:focus-visible {
    background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  }

  .content-list > li > a:hover h2,
  .content-list > li > a:focus-visible h2 {
    color: var(--color-primary);
  }

  .meta {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .copy h2 {
    margin: 0;
    font-size: var(--text-h3);
    font-weight: 520;
    line-height: var(--leading-heading);
  }

  .copy p {
    max-width: 46rem;
    margin: 0.65rem 0 1rem;
    color: var(--color-muted);
  }

  .arrow {
    color: var(--color-accent);
    font-size: var(--text-h3);
  }

  @media (max-width: 44rem) {
    .content-list > li > a {
      grid-template-columns: 1fr auto;
    }

    .meta {
      grid-column: 1 / -1;
      flex-direction: row;
      gap: 0.75rem;
    }
  }
</style>
