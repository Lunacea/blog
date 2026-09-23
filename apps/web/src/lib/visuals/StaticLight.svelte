<script lang="ts">
  import type { Snippet } from "svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  /**
   * SVG だけで描くサイトのグレイン。JavaScript を要さないため最初に見えるものであり、
   * モーション無効・強制配色・WebGL なしの読者が持ち続けるものでもある。
   * ホームと一覧はアニメーション背景を `overlay` として渡し、それはグレインの下に入る。
   */
  let {
    condition = "neutral",
    id = "static",
    webgl,
    overlay,
  }: {
    condition?: WeatherVisualCondition;
    /** 背景が複数ある場合に SVG のグラデーションとフィルタの id を区別する。 */
    id?: string;
    webgl?: boolean;
    overlay?: Snippet;
  } = $props();
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-(--z-base) h-lvh overflow-hidden bg-canvas print:hidden forced-colors:hidden" aria-hidden="true" data-editorial-light data-webgl={webgl} data-weather={condition}>
  {@render overlay?.()}

  <svg class="absolute inset-0 size-full opacity-(--grain-opacity) mix-blend-multiply theme-dark:mix-blend-screen">
    <filter id={`${id}-grain`}>
      <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id}-grain)`} />
  </svg>
</div>
