<script lang="ts">
  import type { Snippet } from "svelte";
  import StatusBadge from "../components/StatusBadge.svelte";

  let {
    href,
    title,
    role,
    period,
    status,
    technologies,
    view = "grid",
    media,
    mediaTransitionName,
    hoverMedia = true,
  }: {
    href: string;
    title: string;
    role: string;
    period: string;
    status: "stable" | "growing" | "fragment" | "deprecated";
    technologies: readonly string[];
    view?: "grid" | "list";
    media: Snippet;
    mediaTransitionName?: string;
    hoverMedia?: boolean;
  } = $props();
</script>

<a class:grid={view === "grid"} class:list={view === "list"} {href}>
  <div
    class="media"
    class:list-media={view === "list"}
    class:has-hover-media={hoverMedia}
    style:view-transition-name={mediaTransitionName}
  >{@render media()}</div>
  <div class="copy">
    <div class="meta"><time>{period}</time><StatusBadge {status} /></div>
    <h2>{title}</h2>
    <p class="role">{role}</p>
    {#if view === "list"}
      <ul aria-label="使用技術">
        {#each technologies.slice(0, 2) as item}<li>{item}</li>{/each}
      </ul>
    {/if}
  </div>
</a>

<style>
  a { display: block; color: inherit; text-decoration: none; }
  .media { overflow: hidden; background: var(--color-surface); }
  .media :global(picture), .media :global([data-preview-media]) { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
  .media :global(img), .media :global([data-preview-media]) { transition: transform var(--motion-duration-base) var(--motion-ease-enter); }
  a:hover .media :global(img), a:focus-visible .media :global(img), a:hover .media :global([data-preview-media]), a:focus-visible .media :global([data-preview-media]) { transform: scale(1.015); }
  .grid .copy { padding-top: var(--space-5); }
  a.list { position: relative; display: grid; min-height: 5.5rem; align-items: center; border-top: 1px solid var(--color-line); padding: var(--space-3) var(--space-4); transition: color var(--motion-duration-micro) var(--motion-ease-standard), background var(--motion-duration-micro) var(--motion-ease-standard); }
  a.list:hover, a.list:focus-visible { color: var(--color-white); background: color-mix(in srgb, var(--color-black) 32%, transparent); text-shadow: 0 1px 1rem rgb(0 0 0 / 45%); }
  .list-media { position: fixed; z-index: var(--z-backdrop); inset: 0; width: 100vw; height: 100dvh; opacity: 0; pointer-events: none; transition: opacity var(--motion-duration-base) var(--motion-ease-enter); }
  .list-media:not(.has-hover-media) { display: none; }
  .list-media :global(picture), .list-media :global(img), .list-media :global([data-preview-media]) { width: 100%; height: 100%; aspect-ratio: auto; object-fit: cover; }
  a.list:hover .list-media, a.list:focus-visible .list-media { opacity: .92; }
  .meta { display: flex; justify-content: space-between; gap: var(--space-3); color: var(--color-muted); font-size: var(--text-caption); font-variant-numeric: tabular-nums; }
  h2 { margin: var(--space-2) 0; font-family: var(--font-serif); font-size: var(--text-h2); font-weight: var(--weight-regular); line-height: var(--leading-heading); }
  .list h2 { font-size: var(--text-h3); }
  .role { margin: var(--space-3) 0 0; }
  ul { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-3) 0 0; padding: 0; list-style: none; color: var(--color-muted); font-size: var(--text-caption); }
  a.list:hover .meta, a.list:focus-visible .meta, a.list:hover .role, a.list:focus-visible .role, a.list:hover ul, a.list:focus-visible ul { color: currentColor; }
  @media (hover: none), (pointer: coarse) {
    .list-media { display: none; }
    a.list:hover, a.list:focus-visible { color: inherit; background: var(--color-surface); text-shadow: none; }
  }
</style>
