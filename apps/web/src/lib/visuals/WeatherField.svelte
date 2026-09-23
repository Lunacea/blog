<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { useFixedLocationWeather } from "$lib/weather.ts";
  import EditorialLight from "./EditorialLight.svelte";
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

  // 開発時の上書きも初回描画後の地色へ反映する。
  $effect(() => {
    if (!dev) return;
    const visualOverride = parseWeatherVisualOverride(page.url.searchParams.get("weather"));
    const intensityOverride = parseWeatherVisualIntensityOverride(
      page.url.searchParams.get("intensity"),
    );
    if (visualOverride) document.documentElement.dataset.weather = visualOverride;
    if (intensityOverride) document.documentElement.dataset.intensity = intensityOverride;
  });
</script>

<EditorialLight {condition} {intensity} />
