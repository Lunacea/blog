<script lang="ts">
  import type { Snippet } from "svelte";
  import TagLabel from "../components/TagLabel.svelte";

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

<a
  class:grid={view === "grid"}
  class:list={view === "list"}
  {href}
  data-cursor="interactive"
  data-cursor-label="View more"
>
  {#if hasMedia && media}
    <figure class:list-media={view === "list"} style:view-transition-name={mediaTransitionName}>
      {@render media()}
    </figure>
  {/if}
  <div class="copy">
    <div class="meta">
      <TagLabel tag={category} />
      <time datetime={publishedAt}>{publishedAt}</time>
    </div>
    <h2>{title}</h2>
    {#if view === "grid"}
      <p>{summary}</p>
      <ul aria-label="代表タグ">
        {#each tags.slice(0, 4) as tag}<li><TagLabel {tag} /></li>{/each}
      </ul>
    {/if}
  </div>
</a>

<style>
  a { position: relative; display: block; color: inherit; text-decoration: none; }
  figure { overflow: hidden; margin: 0 0 var(--space-5); aspect-ratio: 16 / 10; background: var(--color-surface); }
  a.list { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 5.5rem; align-items: center; border-top: 1px solid var(--color-line); padding: var(--space-3) var(--space-4); transition: color var(--motion-duration-micro) var(--motion-ease-standard), background var(--motion-duration-micro) var(--motion-ease-standard); }
  a.list:hover, a.list:focus-visible { color: var(--color-white); background: color-mix(in srgb, var(--color-black) 32%, transparent); text-shadow: 0 1px 1rem rgb(0 0 0 / 45%); }
  .list-media { position: fixed; z-index: var(--z-backdrop); inset: 0; width: 100vw; height: 100dvh; margin: 0; opacity: 0; pointer-events: none; transition: opacity var(--motion-duration-base) var(--motion-ease-enter); }
  .list-media :global(picture), .list-media :global(img) { width: 100%; height: 100%; object-fit: cover; }
  a.list:hover .list-media, a.list:focus-visible .list-media { opacity: .92; }
  .meta { display: grid; justify-items: start; gap: var(--space-2); color: var(--color-muted); font-size: var(--text-caption); font-variant-numeric: tabular-nums; }
  a.list:hover .meta, a.list:focus-visible .meta, a.list:hover p, a.list:focus-visible p, a.list:hover ul, a.list:focus-visible ul { color: currentColor; }
  h2 { margin: var(--space-1) 0; font-family: var(--font-serif); font-size: var(--text-h3); font-weight: var(--weight-regular); line-height: var(--leading-heading); }
  .grid h2 { font-family: var(--font-serif); font-size: var(--text-h2); font-weight: var(--weight-regular); }
  .copy > p { max-width: 40rem; margin: 0; color: var(--color-muted); line-height: var(--leading-ui); }
  ul { display: flex; flex-wrap: wrap; gap: var(--space-1); margin: var(--space-3) 0 0; padding: 0; list-style: none; color: var(--color-muted); font-size: var(--text-caption); }
  @media (hover: none), (pointer: coarse) {
    .list-media { display: none; }
    a.list:hover, a.list:focus-visible { color: inherit; background: var(--color-surface); text-shadow: none; }
  }
</style>
