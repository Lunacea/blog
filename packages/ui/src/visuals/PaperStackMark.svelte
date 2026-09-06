<script lang="ts">
  import { cn } from "../utils.ts";
  import { glyphFrame, glyphStroke, glyphTransition } from "../icons/glyph.ts";

  /** Sheets stand for reading minutes; the front corner peels instead of drawing a progress bar. */
  let { layers = 1, class: className = "" }: { layers?: number; class?: string } = $props();
  const count = $derived(Math.min(5, Math.max(1, Math.round(layers))));
  const behind = $derived(Array.from({ length: count - 1 }, (_, index) => (index + 1) * 1.9));
</script>

<svg
  class={cn(glyphFrame, glyphStroke, glyphTransition, "paper-mark size-(--space-5)", className)}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
  data-paper-mark={count}
>
  {#each behind as offset (offset)}
    <path
      d="M7 6.5H17V18.5H7Z"
      transform={`translate(${-offset} ${-offset})`}
      opacity="0.55"
    />
  {/each}
  <path d="M7 6.5H14L17 9.5V18.5H7Z" />
  <path
    class="paper-fold origin-[14px_6.5px] transition-[scale] duration-(--motion-duration-fast) ease-standard motion-full:in-[a:hover]:scale-[1.45] motion-full:in-[a:focus-visible]:scale-[1.45] pointer-coarse:scale-100! motion-reduce:scale-100!"
    d="M14 6.5V9.5H17"
    data-paper-fold
  />
</svg>
