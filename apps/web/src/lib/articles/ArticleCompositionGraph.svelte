<script lang="ts">
  import type { ArticleCompositionVisual } from "./article-composition-types.ts";
  let { composition, id, spans = [] }: {
    composition: ArticleCompositionVisual;
    id: string;
    /** 各節が描画後の一覧のどこにあるか（高さに対する割合）。 */
    spans?: ReadonlyArray<{ id: string; start: number; end: number }>;
  } = $props();

  /** 本文は一定の間隔の罫線として描く。短いブロックは本数が減るだけ。 */
  const lineGap = 7;
  const charactersPerLine = 34;

  /** 複数の見出しにまたがるブロックは節の境界で切り、各断片をそれぞれの節に対応させる。 */
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
   * 断片は自分の節の中だけで射影する。節の境界の値は前後どちらの節にも属するため、値から節を
   * 探すと次の節の先頭が前の節の末尾に引き寄せられ、節の間の余白をまたいで描かれてしまう。
   */
  const placed = $derived.by(() => {
    const byId = new Map(spans.map((span) => [span.id, span]));
    return (piece: (typeof pieces)[number], value: number) => {
      const section = piece.section;
      const span = section ? byId.get(section.id) : undefined;
      if (!section || !span) return projected(value);
      const range = section.end - section.start;
      const ratio = range > 0 ? (value - section.start) / range : 0;
      return span.start + Math.min(1, Math.max(0, ratio)) * (span.end - span.start);
    };
  });

  /** 記事内の進行度と一覧上の位置は尺度が異なるため、各断片を所属する節を通して射影する。 */
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

<svg class="pointer-events-none block size-full text-quiet" viewBox="0 0 48 480" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-composition-graph data-map-id={id}>
  {#each pieces as piece}
    {@const top = placed(piece, piece.start) * 480}
    {@const height = Math.max(1, (placed(piece, piece.end) - placed(piece, piece.start)) * 480 - 2)}
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
