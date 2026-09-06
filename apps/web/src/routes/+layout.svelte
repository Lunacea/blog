<script lang="ts">
  import "$ui/foundations/global.css";
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
  const isArticleDetail = $derived(/^\/articles\/[^/]+\/?$/.test(page.url.pathname));
  // Reading routes keep a settled sky: weather never animates or changes under the catalog or an article.
  const isReadingRoute = $derived(page.url.pathname.startsWith("/articles"));
  // Route data rather than the URL, so prerendered routes stay free of search parameters.
  const searchQuery = $derived.by(() => {
    const query = (page.data as { query?: unknown }).query;
    return typeof query === "string" ? query : "";
  });
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

<a class="fixed top-(--space-2) left-(--space-2) z-(--z-skip-link) min-h-(--control-size) translate-y-[-150%] bg-panel px-(--space-4) py-(--space-3) transition-transform duration-(--motion-duration-fast) ease-enter focus:translate-y-0" href="#main-content">本文へ移動</a>
<FontPreloads />
<WeatherBackdrop condition={isReadingRoute ? "clear" : (devWeather ?? $weather.visual)} />
<div
  class="site-noise pointer-events-none fixed inset-0 z-(--z-content) bg-[url('/textures/editorial-noise.svg')] bg-size-[192px_192px] bg-repeat opacity-36 mix-blend-multiply data-[noise-motion=ambient]:motion-full:animate-site-noise theme-dark:invert theme-dark:mix-blend-screen forced-colors:hidden print:hidden"
  data-noise-motion={isArticleDetail ? "reduced" : "ambient"}
  aria-hidden="true"
></div>
<SiteHeader navigation={primaryNavigation} pathname={page.url.pathname} {searchQuery}>
  {#snippet theme()}<ThemeToggle />{/snippet}
  {#snippet display()}<SettingsPanel />{/snippet}
</SiteHeader>
<main class="relative z-(--z-visual)" style:view-transition-name="page-content" id="main-content">
  {@render children()}
</main>
<RevealManager />
<CursorLayer />
