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
</script>

<EditorialLight {condition} {intensity} />
