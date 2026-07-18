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
  const isArticleDetail = $derived(/^\/articles\/[^/]+\/?$/.test(page.url.pathname));
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
<div
  class="site-noise"
  data-noise-motion={isArticleDetail ? "reduced" : "ambient"}
  aria-hidden="true"
></div>
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
  main {
    position: relative;
    z-index: var(--z-visual);
    view-transition-name: page-content;
  }

  .site-noise {
    position: fixed;
    z-index: var(--z-content);
    inset: 0;
    pointer-events: none;
    background-image: url("/textures/editorial-noise.svg");
    background-repeat: repeat;
    background-size: 192px 192px;
    mix-blend-mode: multiply;
    opacity: .36;
  }

  :global(html[data-motion="full"]) .site-noise[data-noise-motion="ambient"] {
    animation: site-noise-shift var(--motion-duration-ambient) steps(8, end) infinite;
  }

  @keyframes site-noise-shift {
    0% { background-position: 0 0; }
    25% { background-position: 47px -31px; }
    50% { background-position: -23px 61px; }
    75% { background-position: 73px 21px; }
    100% { background-position: 192px 192px; }
  }

  :global(html[data-theme="dark"]) .site-noise {
    filter: invert(1);
    mix-blend-mode: screen;
  }

  @media (forced-colors: active), print {
    .site-noise {
      display: none;
    }
  }

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
