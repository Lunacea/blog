<script lang="ts">
  import LiquidDistortion from "./LiquidDistortion.svelte";
  import LiquidTitle from "./LiquidTitle.svelte";

  let { text = "LUNACEA", slotIndex = 4 }: { text?: string; slotIndex?: number } = $props();
</script>

<main class="grid gap-(--space-16) p-(--space-4) sm:p-(--space-8)">
  <section class="grid gap-(--space-4)" aria-labelledby="title-heading">
    <h2 class="m-0 font-stretch-84% text-folio tracking-folio text-quiet uppercase" id="title-heading">
      Liquid title
    </h2>
    <p class="m-0 max-w-prose text-small text-quiet">
      The wordmark warps under the pointer and settles on a spring. The slotted letter keeps its
      advance and never warps, because on Home it is also the control being aimed at.
    </p>
    <LiquidTitle {text} {slotIndex} class="text-h3 leading-none font-strong tracking-heading wrap-anywhere">
      {#snippet slot()}
        <span class="grid size-[.9em] place-items-center rounded-full bg-ink"></span>
      {/snippet}
    </LiquidTitle>
  </section>

  <section class="grid gap-(--space-4)" aria-labelledby="distortion-heading">
    <h2 class="m-0 font-stretch-84% text-folio tracking-folio text-quiet uppercase" id="distortion-heading">
      Liquid distortion
    </h2>
    <p class="m-0 max-w-prose text-small text-quiet">
      The same spring applied to a surface rather than a word. With motion off it renders flat and
      the content stays fully readable.
    </p>
    <LiquidDistortion class="max-w-prose border border-rule p-(--space-6)">
      <p class="m-0 text-body leading-copy">
        静かな余白の中で、文章と記録を長く読み続けられる構造をつくる。
      </p>
    </LiquidDistortion>
  </section>
</main>
