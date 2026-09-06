<script lang="ts">
  import WeatherAtmosphere from "./WeatherAtmosphere.svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let {
    condition = "neutral",
    hidden = false,
  }: {
    condition?: WeatherVisualCondition;
    hidden?: boolean;
  } = $props();
</script>

<div
  class="pointer-events-none fixed inset-0 z-(--z-weather) data-[condition=rain]:z-(--z-weather-glass) data-[condition=snow]:z-(--z-weather-glass) overflow-hidden data-[hidden=true]:hidden forced-colors:hidden print:hidden"
  data-condition={condition}
  data-hidden={hidden}
  aria-hidden="true"
>
  {#if !hidden}<WeatherAtmosphere {condition} />{/if}
</div>
