<script lang="ts">
  import PaperStackMark from "../visuals/PaperStackMark.svelte";
  import { cn } from "../utils.ts";
  import type { ArticleCompositionVisual } from "../visuals/article-composition-types.ts";

  let { composition, class: className = "" }: {
    composition: ArticleCompositionVisual;
    class?: string;
  } = $props();
  const minutes = $derived(Math.max(1, composition.estimatedMinutes));
</script>

<span class={cn("reading-length inline-flex items-end gap-2 text-(length:--text-caption) leading-none text-quiet tabular-nums", className)}>
  <span>{minutes}分</span>
  <PaperStackMark layers={composition.paperLayers} />
</span>
