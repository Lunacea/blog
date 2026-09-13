<script lang="ts">
  import { page } from "$app/state";
  import { ambientWeather } from "$lib/weather.ts";
  import { FontPreloads, SettingsPanel, SiteFooter, SiteHeader, ThemeToggle } from "$ui/components";
  import "$ui/foundations/global.css";
  import { installAnchorNavigation, installPageTransitions } from "$ui/motion";
  import StaticLight from "$ui/visuals/StaticLight.svelte";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { onMount } from "svelte";

  let { children } = $props();
  const masthead = $derived(page.url.pathname === "/");
  // ホームと一覧は自前の背景を持つため、シェルでは重ねない。
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

<a class="fixed top-(--space-2) left-(--space-2) z-(--z-skip-link) min-h-control-size translate-y-[-150%] bg-panel px-(--space-4) py-(--space-3) transition-transform duration-(--motion-duration-fast) ease-enter focus:translate-y-0" href="#main-content">本文へ移動</a>
<FontPreloads />
{#if !masthead}
  <SiteHeader navigation={primaryNavigation} pathname={page.url.pathname}>
    {#snippet theme()}<ThemeToggle />{/snippet}
    {#snippet display()}<SettingsPanel />{/snippet}
  </SiteHeader>
{/if}
<main class="relative z-(--z-visual)" id="main-content">
  <!-- 負のレイヤーがページ背景より上に来るよう main の中に置く。 -->
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
