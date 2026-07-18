<script lang="ts">
  import type { Content, ContentType } from "@lunacea/schemas";

  type ContentListEntry = {
    slug: string;
    type: ContentType;
    title: string;
    publishedAt: string;
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
    return "/archive/" + entry.type + "s/" + entry.slug;
  }
</script>

<ol class="content-list">
  {#each entries as entry}
    <li data-reveal="line">
      <a
        href={href(entry)}
        data-cursor={entry.type === "article" ? "interactive" : undefined}
        data-cursor-label={entry.type === "article" ? "View more" : undefined}
      >
        <div class="meta">
          {#if showType}<span>{entry.type}</span>{/if}
          <time datetime={entry.publishedAt}>{entry.publishedAt}</time>
        </div>
        <h2>{entry.title}</h2>
      </a>
    </li>
  {/each}
</ol>

<style>
  .content-list {
    margin: 0;
    padding: 0;
    border-bottom: 1px solid var(--color-line);
    list-style: none;
  }

  .content-list > li > a {
    display: grid;
    min-height: 5.5rem;
    grid-template-columns: minmax(8rem, .28fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-4);
    border-top: 1px solid var(--color-line);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    transition: background var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .content-list > li > a:hover,
  .content-list > li > a:focus-visible {
    background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2);
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  h2 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
    line-height: var(--leading-heading);
  }

  @media (max-width: 44rem) {
    .content-list > li > a {
      grid-template-columns: 1fr;
      gap: var(--space-1);
    }
  }
</style>
