<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { useFixedLocationWeather } from "$lib/weather.ts";
  import { parsePulseOverride } from "./ambient-pulses.ts";
  import EditorialLight from "./EditorialLight.svelte";
  import { parseTimeOverride } from "./sunlight.ts";
  import {
    parseWeatherVisualIntensityOverride,
    parseWeatherVisualOverride,
  } from "./weather-visual.ts";

  const weather = useFixedLocationWeather();
  const condition = $derived(
    (dev ? parseWeatherVisualOverride(page.url.searchParams.get("weather")) : null) ??
      $weather.visual,
  );
  const intensity = $derived(
    (dev ? parseWeatherVisualIntensityOverride(page.url.searchParams.get("intensity")) : null) ??
      $weather.intensity,
  );
  // 開発時だけ、待機中の出来事（?pulse=ripple）と時刻（?time=2026-09-23T17:30+09:00）を固定できる。
  const options = dev
    ? {
      pulse: parsePulseOverride(page.url.searchParams.get("pulse")),
      time: parseTimeOverride(page.url.searchParams.get("time")),
    }
    : undefined;
</script>

<EditorialLight {condition} {intensity} {options} />
