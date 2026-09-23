<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import type { LinkPreviewRegistry } from "./link-preview-context.ts";
  import { provideLinkPreviews } from "./link-preview-context.ts";
  import ReadingEnhancements from "./ReadingEnhancements.svelte";
  import type { ArticleCompositionVisual } from "./article-composition-types.ts";

  let {
    component,
    tools,
    headings = [],
    linkPreviews = {},
    class: className = "",
    composition,
    after,
  }: {
    component: Component;
    /** PC の目次の下に固定する読書用ツール。 */
    tools?: Snippet;
    /** 本文の下、紙の内側に置くもの。読み終えた読者が触る操作はここ。 */
    after?: Snippet;
    headings?: Array<{ id: string; text: string; level: number }>;
    linkPreviews?: LinkPreviewRegistry;
    class?: string;
    composition?: ArticleCompositionVisual;
  } = $props();
  let ContentComponent = $derived(component);
  let prose = $state<HTMLElement | null>(null);
  provideLinkPreviews(() => linkPreviews);
</script>

<!--
  記事の面は紙そのもの。ここだけ地を持ち、外（天候の光）はこの面の上下にだけ見える。
  繊維は横方向に少し引き伸ばした細かいノイズで、紙の目として読める強さに留める。
-->
<div class={["reading-surface article-paper relative isolate border-y border-rule bg-paper py-section [&.media-led-reading]:border-t-0", className]}>
  <svg
    class="pointer-events-none absolute inset-0 -z-1 size-full opacity-[.045] mix-blend-multiply theme-dark:opacity-[.07] theme-dark:mix-blend-screen print:hidden forced-colors:hidden"
    aria-hidden="true"
  >
    <filter id="paper-fibre">
      <feTurbulence type="fractalNoise" baseFrequency=".92 .48" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#paper-fibre)" />
  </svg>
  <span class="absolute top-0" data-reading-start aria-hidden="true"></span>
  {#key component}
    <div class="shell grid grid-cols-[minmax(0,var(--prose-width))_minmax(var(--space-12),1fr)] justify-between gap-(--space-8) read-wide:grid-cols-[minmax(0,var(--prose-width))_minmax(var(--layout-grid-compact),1fr)] read-wide:gap-[clamp(var(--space-8),8vw,var(--space-32))] max-read:grid-cols-1 max-read:gap-8 max-read-wide:gap-y-0">
      <div class="prose" bind:this={prose}><ContentComponent /></div>
      <ReadingEnhancements root={prose} {headings} {composition} {tools} />
    </div>
  {/key}
  {#if after}<div class="shell">{@render after()}</div>{/if}
</div>
