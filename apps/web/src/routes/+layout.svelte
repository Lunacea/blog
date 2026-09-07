<script lang="ts">
  import "$ui/foundations/global.css";
  import { page } from "$app/state";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { FontPreloads, SettingsPanel, SiteFooter, SiteHeader, ThemeToggle } from "$ui/components";
  import { installAnchorNavigation, installPageTransitions } from "$ui/motion";
  import { ambientWeather } from "$lib/weather-context.ts";
  import StaticLight from "$ui/visuals/StaticLight.svelte";
  import { onMount } from "svelte";

  let { children } = $props();
  // Home is its own masthead; every other route gets the hairline bar.
  const masthead = $derived(page.url.pathname === "/");
  // Home and the catalog mount their own animated field, so the shell does not add a second one.
  const ownsField = $derived(masthead || page.url.pathname === "/articles");
  installPageTransitions();
  onMount(() => {
    const stopAnchorNavigation = installAnchorNavigation();
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
{#if !masthead}
  <SiteHeader navigation={primaryNavigation} pathname={page.url.pathname}>
    {#snippet theme()}<ThemeToggle />{/snippet}
    {#snippet display()}<SettingsPanel />{/snippet}
  </SiteHeader>
{/if}
<main class="relative z-(--z-visual)" id="main-content">
  <!-- The field lives inside main so its negative layer stays above the page background. -->
  {#if !ownsField}<StaticLight id="page" condition={$ambientWeather} />{/if}
  {@render children()}
</main>
<SiteFooter
  name={siteConfig.name}
  email={siteConfig.author.email}
  github={siteConfig.author.github}
  x={siteConfig.author.x}
  startYear={2025}
>
  {#snippet theme()}<ThemeToggle />{/snippet}
  {#snippet display()}<SettingsPanel />{/snippet}
</SiteFooter>
