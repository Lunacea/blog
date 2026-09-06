<script lang="ts">
  import AmbientHero from "./AmbientHero.svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let { weather = "neutral" }: { weather?: WeatherVisualCondition } = $props();
</script>

<section class="relative min-h-[70vh] overflow-clip border border-rule" aria-label="Ambient Hero visual preview">
  <AmbientHero {weather} />
  <div class="relative z-(--z-visual) max-w-2xl p-10 max-sm:p-5">
    <p class="font-code text-(length:--text-caption) text-quiet">Visuals / Ambient Hero</p>
    <h2 class="my-6 font-editorial text-(length:--text-display) font-regular leading-display tracking-(--tracking-display) max-sm:text-(length:--text-h2) max-sm:leading-title max-sm:wrap-anywhere">Quiet structures,<br />growing records.</h2>
    <span class="font-code text-(length:--text-caption) text-quiet">HTML text remains the semantic source of truth.</span>
  </div>
</section>
