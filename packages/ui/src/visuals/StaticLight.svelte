<script lang="ts">
  import type { Snippet } from "svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  /**
   * The site's grain, drawn entirely in SVG. It needs no JavaScript, so it is what every reader
   * sees first and what motion-off, forced-colors and no-WebGL readers keep. Home and the catalog
   * pass their animated field as `overlay`, which sits under the grain so the grain always reads
   * as the topmost surface.
   */
  let {
    condition = "neutral",
    id = "static",
    webgl,
    overlay,
  }: {
    condition?: WeatherVisualCondition;
    /** Distinguishes the SVG gradient and filter ids when more than one field is mounted. */
    id?: string;
    webgl?: boolean;
    overlay?: Snippet;
  } = $props();
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 h-lvh -z-1 overflow-hidden print:hidden forced-colors:hidden" aria-hidden="true" data-editorial-light data-webgl={webgl} data-weather={condition}>
  <!--
    Grain only. Any gradient here is visible before the animated field has loaded, and a light
    that nothing is animating is just a smudge; the field fades in on its own once it is ready.
  -->
  {#if overlay}{@render overlay()}{/if}

  <svg class="absolute inset-0 size-full opacity-(--grain-opacity) mix-blend-multiply theme-dark:mix-blend-screen">
    <filter id={`${id}-grain`}>
      <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id}-grain)`} />
  </svg>
</div>
