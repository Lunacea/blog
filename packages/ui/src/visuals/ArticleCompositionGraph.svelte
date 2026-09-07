<script lang="ts">
  import type { ArticleCompositionVisual } from "./article-composition-types.ts";
  let { composition, id, orientation = "vertical", spans = [] }: {
    composition: ArticleCompositionVisual;
    id: string;
    orientation?: "horizontal" | "vertical";
    /** Where each section actually sits in the rendered list, as fractions of its height. */
    spans?: ReadonlyArray<{ id: string; start: number; end: number }>;
  } = $props();

  /** Prose reads as ruled lines at a constant rhythm, so a short block simply draws fewer. */
  const lineGap = 7;
  const charactersPerLine = 34;

  /**
   * A block that runs across several headings would otherwise be drawn as one slab beside the
   * first of them, so every block is cut at the section boundaries it crosses and each piece is
   * placed against its own section.
   */
  const pieces = $derived.by(() => {
    const sections = composition.sections;
    if (!sections.length) {
      return composition.blocks.map((block) => ({
        kind: block.kind,
        characters: block.characters,
        start: block.start,
        end: block.end,
        section: undefined as (typeof sections)[number] | undefined,
      }));
    }
    return composition.blocks.flatMap((block) =>
      sections.flatMap((section) => {
        const start = Math.max(block.start, section.start);
        const end = Math.min(block.end, section.end);
        if (end <= start) return [];
        const span = block.end - block.start;
        const share = span > 0 ? (end - start) / span : 1;
        return [{
          kind: block.kind,
          characters: Math.max(1, Math.round(block.characters * share)),
          start,
          end,
          section,
        }];
      })
    );
  });

  /**
   * Article progress and list position are different scales once the rows take their natural
   * height, so every piece is projected through the section that contains it.
   */
  const projected = $derived.by(() => {
    const pairs = composition.sections.flatMap((section) => {
      const span = spans.find((candidate) => candidate.id === section.id);
      return span ? [{ section, span }] : [];
    });
    if (!pairs.length) return (value: number) => value;
    const first = pairs[0];
    const last = pairs[pairs.length - 1];
    return (value: number) => {
      if (value <= first.section.start) return first.span.start;
      if (value >= last.section.end) return last.span.end;
      for (const { section, span } of pairs) {
        if (value < section.start || value > section.end) continue;
        const range = section.end - section.start;
        const ratio = range > 0 ? (value - section.start) / range : 0;
        return span.start + ratio * (span.end - span.start);
      }
      return value;
    };
  });
</script>

<svg class="pointer-events-none block size-full text-quiet" viewBox="0 0 48 480" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-composition-graph data-map-id={id} data-orientation={orientation}>
  {#each pieces as piece}
    {@const top = projected(piece.start) * 480}
    {@const height = Math.max(1, (projected(piece.end) - projected(piece.start)) * 480 - 2)}
    {#if piece.kind === "text"}
      {@const written = Math.max(1, Math.round(piece.characters / charactersPerLine))}
      {@const lines = Math.max(1, Math.min(written, Math.floor(height / lineGap) || 1))}
      {#each Array(lines) as _, index}
        <rect x="4" y={top + index * lineGap} width={index === lines - 1 ? 12 + piece.characters % 26 : 36} height="1.4" fill="currentColor" />
      {/each}
    {:else}
      <rect x="4" y={top} width="38" {height} fill="var(--color-accent)" />
    {/if}
  {/each}
</svg>
