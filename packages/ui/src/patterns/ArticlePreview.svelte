<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    href,
    title,
    summary,
    category,
    publishedAt,
    tags,
    view = "list",
    hasMedia = false,
    media,
    mediaTransitionName,
  }: {
    href: string;
    title: string;
    summary: string;
    category: string;
    publishedAt: string;
    tags: readonly string[];
    view?: "grid" | "list";
    hasMedia?: boolean;
    media?: Snippet;
    mediaTransitionName?: string;
  } = $props();
</script>

<a class:grid={view === "grid"} class:list={view === "list"} {href}>
  {#if view === "grid" && hasMedia && media}
    <figure style:view-transition-name={mediaTransitionName}>{@render media()}</figure>
  {/if}
  <div class="copy">
    <div class="meta"><span>{category}</span><time datetime={publishedAt}>{publishedAt}</time></div>
    <h2>{title}</h2>
    <p>{summary}</p>
    <ul aria-label="代表タグ">
      {#each tags.slice(0, view === "grid" ? 4 : 2) as tag}<li>{tag}</li>{/each}
    </ul>
  </div>
</a>

<style>
  a { display: block; color: inherit; text-decoration: none; }
  figure { overflow: hidden; margin: 0 0 var(--space-5); aspect-ratio: 16 / 10; background: var(--color-surface); }
  a.list { display: grid; grid-template-columns: minmax(0, 1fr); padding: var(--space-6) var(--space-3); transition: background var(--motion-duration-micro) var(--motion-ease-standard); }
  a.list:hover, a.list:focus-visible { background: color-mix(in srgb, var(--color-surface) 70%, transparent); }
  .meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-3); color: var(--color-muted); font-size: var(--text-caption); font-variant-numeric: tabular-nums; }
  h2 { margin: var(--space-2) 0; font-size: var(--text-h3); line-height: var(--leading-heading); }
  .grid h2 { font-family: var(--font-serif); font-size: var(--text-h2); font-weight: var(--weight-regular); }
  .copy > p { max-width: 40rem; margin: 0; color: var(--color-muted); }
  ul { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-4) 0 0; padding: 0; list-style: none; color: var(--color-muted); font-size: var(--text-caption); }
</style>
