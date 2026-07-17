<script lang="ts">
  import type { Snippet } from "svelte";
  import StatusBadge from "../components/StatusBadge.svelte";

  let {
    href,
    title,
    summary,
    role,
    period,
    status,
    technologies,
    view = "grid",
    media,
    mediaTransitionName,
  }: {
    href: string;
    title: string;
    summary: string;
    role: string;
    period: string;
    status: "stable" | "growing" | "fragment" | "deprecated";
    technologies: readonly string[];
    view?: "grid" | "list";
    media: Snippet;
    mediaTransitionName?: string;
  } = $props();
</script>

<a class:grid={view === "grid"} class:list={view === "list"} {href}>
  <div class="media" style:view-transition-name={mediaTransitionName}>{@render media()}</div>
  <div class="copy">
    <div class="meta"><time>{period}</time><StatusBadge {status} /></div>
    <h2>{title}</h2>
    {#if view === "grid"}<p class="summary">{summary}</p>{/if}
    <p class="role">{role}</p>
    <ul aria-label="使用技術">
      {#each technologies.slice(0, view === "grid" ? 4 : 3) as item}<li>{item}</li>{/each}
    </ul>
  </div>
</a>

<style>
  a { display: block; color: inherit; text-decoration: none; }
  .media { overflow: hidden; background: var(--color-surface); }
  .media :global(picture), .media :global([data-preview-media]) { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
  .media :global(img), .media :global([data-preview-media]) { transition: transform var(--motion-duration-base) var(--motion-ease-enter); }
  a:hover .media :global(img), a:focus-visible .media :global(img), a:hover .media :global([data-preview-media]), a:focus-visible .media :global([data-preview-media]) { transform: scale(1.015); }
  .grid .copy { padding-top: var(--space-5); }
  a.list { display: grid; grid-template-columns: minmax(9rem, .6fr) minmax(0, 1.4fr); align-items: center; gap: clamp(var(--space-5), 5vw, var(--space-16)); padding: var(--space-4); transition: background var(--motion-duration-micro) var(--motion-ease-standard); }
  a.list:hover, a.list:focus-visible { background: color-mix(in srgb, var(--color-surface) 70%, transparent); }
  .meta { display: flex; justify-content: space-between; gap: var(--space-3); color: var(--color-muted); font-size: var(--text-caption); font-variant-numeric: tabular-nums; }
  h2 { margin: var(--space-2) 0; font-family: var(--font-serif); font-size: var(--text-h2); font-weight: var(--weight-regular); line-height: var(--leading-heading); }
  .list h2 { font-family: var(--font-sans); font-size: var(--text-h3); font-weight: var(--weight-component); }
  .summary { max-width: 38rem; margin: 0; color: var(--color-muted); }
  .role { margin: var(--space-3) 0 0; }
  ul { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-3) 0 0; padding: 0; list-style: none; color: var(--color-muted); font-size: var(--text-caption); }
  @media (max-width: 44rem) { a.list { grid-template-columns: minmax(7rem, .45fr) minmax(0, 1fr); gap: var(--space-4); } }
  @media (max-width: 34rem) { a.list { grid-template-columns: 1fr; } }
</style>
