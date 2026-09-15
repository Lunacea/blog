<script lang="ts">
  import EditorialLight from "./EditorialLight.svelte";
  import type { WeatherVisualCondition, WeatherVisualIntensity } from "./weather-visual.ts";

  let { condition = "neutral", intensity = "steady" }: {
    condition?: WeatherVisualCondition;
    intensity?: WeatherVisualIntensity;
  } = $props();
</script>

<EditorialLight {condition} {intensity} />

<main class="relative mx-auto grid min-h-lvh w-[min(calc(100%-(2*var(--layout-gutter))),var(--content-width))] content-center gap-(--space-4) py-(--section-space)">
  <p class="m-0 font-mono text-caption text-quiet">Visuals / Weather light</p>
  <h1 class="m-0 max-w-[14ch] text-h2 leading-tight font-strong tracking-heading" id="home-title">
    静かな構造と記録
  </h1>
  <p class="m-0 max-w-prose text-body leading-copy">
    天候は光としてだけ現れます。降る粒ではなく、空の明るさ、雲の厚み、水面の網、雪原のきらめきとして扱います。
  </p>
  <dl class="m-0 grid grid-cols-1 gap-x-(--space-4) gap-y-(--space-1) font-mono text-caption wrap-anywhere text-quiet sm:grid-cols-[minmax(0,6rem)_minmax(0,1fr)] [&_dd]:m-0">
    <dt>Condition</dt><dd>{condition}</dd>
    <dt>Intensity</dt><dd>{intensity}</dd>
  </dl>
</main>
