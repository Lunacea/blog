<script lang="ts">
  import type { ArticleCompositionVisual } from "./article-composition-types.ts";
  let { composition, id, orientation = "vertical" }: {
    composition: ArticleCompositionVisual;
    id: string;
    orientation?: "horizontal" | "vertical";
  } = $props();

  /** Prose reads as ruled lines at a constant rhythm, so a short block simply draws fewer. */
  const lineGap = 7;
  const charactersPerLine = 34;
</script>

<svg class="pointer-events-none block size-full text-quiet" viewBox="0 0 48 480" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-composition-graph data-map-id={id} data-orientation={orientation}>
  {#each composition.blocks as block}
    {@const top = block.start * 480}
    {@const height = Math.max(1, (block.end - block.start) * 480 - 2)}
    {#if block.kind === "text"}
      {@const written = Math.max(1, Math.round(block.characters / charactersPerLine))}
      {@const lines = Math.max(1, Math.min(written, Math.floor(height / lineGap) || 1))}
      {#each Array(lines) as _, index}
        <rect x="4" y={top + index * lineGap} width={index === lines - 1 ? 12 + block.characters % 26 : 36} height="1.4" fill="currentColor" />
      {/each}
    {:else}
      <rect x="4" y={top} width="38" {height} fill="var(--color-accent)" />
    {/if}
  {/each}
</svg>
