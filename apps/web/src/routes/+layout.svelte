<script lang="ts">
  import { page } from "$app/state";
  import { installAnchorNavigation, installPageTransitions } from "$lib/navigation/page-transitions.ts";
  import { installScrollInertia } from "$lib/navigation/scroll-inertia.ts";
  import SettingsPanel from "$lib/preferences/SettingsPanel.svelte";
  import ThemeToggle from "$lib/preferences/ThemeToggle.svelte";
  import FontPreloads from "$lib/shell/FontPreloads.svelte";
  import SiteFooter from "$lib/shell/SiteFooter.svelte";
  import SiteHeader from "$lib/shell/SiteHeader.svelte";
  import WeatherField from "$lib/visuals/WeatherField.svelte";
  import "../styles/app.css";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { onMount } from "svelte";

  let { children } = $props();
  const masthead = $derived(page.url.pathname === "/");
  installPageTransitions();
  onMount(() => {
    const stopAnchorNavigation = installAnchorNavigation();
    const stopScrollInertia = installScrollInertia();
    return () => {
      stopAnchorNavigation();
      stopScrollInertia();
    };
  });
</script>

<svelte:head>
  {#if siteConfig.sampleMode}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<a class="fixed top-(--space-2) left-(--space-2) z-(--z-skip-link) min-h-control-size translate-y-[-150%] bg-panel px-(--space-4) py-(--space-3) transition-transform duration-(--motion-duration-fast) ease-enter focus:translate-y-0" href="#main-content">本文へ移動</a>
<FontPreloads />
<WeatherField />
{#if !masthead}
  <SiteHeader navigation={primaryNavigation} pathname={page.url.pathname}>
    {#snippet theme()}<ThemeToggle />{/snippet}
    {#snippet display()}<SettingsPanel />{/snippet}
  </SiteHeader>
{/if}
<main class="relative z-(--z-visual)" id="main-content">
  <div class="route-content">
    {@render children()}
  </div>
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
