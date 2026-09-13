<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import type { LinkPreviewRegistry } from "../components/link-preview-context.ts";
  import { provideLinkPreviews } from "../components/link-preview-context.ts";
  import ReadingEnhancements from "./ReadingEnhancements.svelte";
  import type { ArticleCompositionVisual } from "../visuals/article-composition-types.ts";

  let {
    component,
    tools,
    headings = [],
    linkPreviews = {},
    class: className = "",
    composition,
  }: {
    component: Component;
    /** PC の目次の下に固定する読書用ツール。 */
    tools?: Snippet;
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
  {#key component}
    <div class="article-grid shell grid grid-cols-[minmax(0,var(--prose-width))_minmax(var(--space-12),1fr)] justify-between gap-(--space-8) lg:grid-cols-[minmax(0,var(--prose-width))_minmax(var(--layout-grid-compact),1fr)] lg:gap-[clamp(var(--space-8),8vw,var(--space-32))] max-sm:grid-cols-1 max-sm:gap-8">
      <div class="prose" bind:this={prose}><ContentComponent /></div>
      <ReadingEnhancements root={prose} {headings} {composition} {tools} />
    </div>
  {/key}
</div>
