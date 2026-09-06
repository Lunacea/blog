<script lang="ts">
  import type { Component } from "svelte";
  import type { LinkPreviewRegistry } from "../components/link-preview-context.ts";
  import { provideLinkPreviews } from "../components/link-preview-context.ts";
  import ReadingEnhancements from "./ReadingEnhancements.svelte";
  import type { ArticleCompositionVisual } from "../visuals/article-composition-types.ts";

  let {
    component,
    headings = [],
    linkPreviews = {},
    class: className = "",
    composition,
  }: {
    component: Component;
    headings?: Array<{ id: string; text: string; level: number }>;
    linkPreviews?: LinkPreviewRegistry;
    class?: string;
    composition?: ArticleCompositionVisual;
  } = $props();
  let ContentComponent = $derived(component);
  let prose = $state<HTMLElement | null>(null);
  provideLinkPreviews(() => linkPreviews);
</script>

<div class={["reading-surface relative border-y border-rule bg-transparent py-section [&.media-led-reading]:border-t-0", className]}>
  <span class="reading-start absolute top-0" data-reading-start aria-hidden="true"></span>
  <div class="article-grid shell grid grid-cols-[minmax(0,var(--prose-width))_minmax(var(--layout-grid-compact),1fr)] justify-between gap-[clamp(var(--space-8),8vw,var(--space-32))] max-lg:grid-cols-1 max-lg:gap-8">
    <div class="prose" bind:this={prose}><ContentComponent /></div>
    <ReadingEnhancements root={prose} {headings} {composition} />
  </div>
</div>
