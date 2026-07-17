<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import HeroObject from "./HeroObject.svelte";
  import WeatherEnvironment from "./WeatherEnvironment.svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let {
    quality,
    palette,
    yaw,
    pitch,
    weather,
  }: {
    quality: "low" | "high";
    palette: { foreground: string; primary: string; accent: string };
    yaw?: number;
    pitch?: number;
    weather: WeatherVisualCondition;
  } = $props();
</script>

<Canvas
  dpr={quality === "high" ? [1, 1.5] : [1, 1.2]}
  renderMode="on-demand"
  shadows={false}
>
  <T.PerspectiveCamera makeDefault position={[0, 0, 5.8]} fov={32} />
  <WeatherEnvironment {quality} {palette} condition={weather} />
  <HeroObject {quality} {palette} {yaw} {pitch} />
</Canvas>
