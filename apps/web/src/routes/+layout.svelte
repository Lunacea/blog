<script lang="ts">
  import "../app.css";
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { FontPreloads, SettingsPanel, SiteHeader, ThemeToggle } from "$ui/components";
  import { parseWeatherVisualOverride, WeatherBackdrop } from "$ui/visuals";
  import { createWeatherContext, loadFixedLocationWeather } from "$lib/weather-context.ts";
  import { CursorLayer, installAnchorNavigation, installPageTransitions, RevealManager } from "$ui/motion";
  import { onMount } from "svelte";

  let { children } = $props();
  const weather = createWeatherContext();
  const devWeather = $derived(
    dev ? parseWeatherVisualOverride(page.url.searchParams.get("weather")) : null,
  );

  installPageTransitions();
  onMount(() => {
    const stopAnchorNavigation = installAnchorNavigation();
    void loadFixedLocationWeather(weather);
    return stopAnchorNavigation;
  });
</script>

<svelte:head>
  {#if siteConfig.sampleMode}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<a class="skip-link" href="#main-content">本文へ移動</a>
<FontPreloads />
<WeatherBackdrop condition={devWeather ?? $weather.visual} hidden={page.url.pathname === "/"} />
<SiteHeader navigation={primaryNavigation} pathname={page.url.pathname}>
  {#snippet theme()}<ThemeToggle />{/snippet}
  {#snippet display()}<SettingsPanel />{/snippet}
</SiteHeader>
<main id="main-content">
  {@render children()}
</main>
<RevealManager />
<CursorLayer />

<style>
  .skip-link {
    position: fixed;
    z-index: var(--z-skip-link);
    top: var(--space-2);
    left: var(--space-2);
    min-height: var(--control-size);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    transform: translateY(-150%);
    transition: transform var(--motion-duration-fast) var(--motion-ease-enter);
  }

  .skip-link:focus {
    transform: translateY(0);
  }
</style>
