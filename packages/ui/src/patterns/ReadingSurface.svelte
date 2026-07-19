<script lang="ts">
  import type { Component } from "svelte";
  import type { LinkPreviewRegistry } from "../components/link-preview-context.ts";
  import { provideLinkPreviews } from "../components/link-preview-context.ts";
  import ReadingEnhancements from "./ReadingEnhancements.svelte";

  let {
    component,
    headings = [],
    linkPreviews = {},
    class: className = "",
  }: {
    component: Component;
    headings?: Array<{ id: string; text: string; level: number }>;
    linkPreviews?: LinkPreviewRegistry;
    class?: string;
  } = $props();
  let ContentComponent = $derived(component);
  let prose = $state<HTMLElement | null>(null);
  provideLinkPreviews(() => linkPreviews);
</script>

<div class={["reading-surface", className]}>
  <span class="reading-start" data-reading-start aria-hidden="true"></span>
  <div class="shell article-grid">
    <div class="prose" bind:this={prose}><ContentComponent /></div>
    <ReadingEnhancements root={prose} {headings} />
  </div>
</div>

<style>
  .reading-surface {
    position: relative;
    border-block: 1px solid var(--color-line);
    padding-block: var(--section-space);
    background: transparent;
  }

  .reading-surface.media-led-reading {
    border-top: 0;
  }

  .reading-start {
    position: absolute;
    top: 0;
  }

  .article-grid {
    display: grid;
    grid-template-columns:
      minmax(0, var(--prose-width))
      minmax(var(--layout-grid-compact), 1fr);
    justify-content: space-between;
    gap: clamp(var(--space-8), 8vw, var(--space-32));
  }

  @media (max-width: 60rem) {
    .article-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
