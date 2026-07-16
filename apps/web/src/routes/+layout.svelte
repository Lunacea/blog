<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { FontPreloads, SampleBanner, SiteFooter, SiteHeader } from "$ui/components";
  import WeatherWidget from "$lib/components/WeatherWidget.svelte";
  import { CursorLayer, installAnchorNavigation, installPageTransitions, RevealManager } from "$ui/motion";
  import { onMount } from "svelte";

  let { children } = $props();

  installPageTransitions();
  onMount(installAnchorNavigation);
</script>

<svelte:head>
  {#if siteConfig.sampleMode}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<a class="skip-link" href="#main-content">本文へ移動</a>
<FontPreloads />
{#if siteConfig.sampleMode}<SampleBanner />{/if}
<SiteHeader navigation={primaryNavigation} pathname={page.url.pathname}>
  {#snippet environment()}<WeatherWidget compact />{/snippet}
</SiteHeader>
<main id="main-content">
  {@render children()}
</main>
<SiteFooter />
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
