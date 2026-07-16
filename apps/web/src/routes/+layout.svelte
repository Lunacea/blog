<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { SampleBanner, SettingsPanel, SiteFooter, SiteHeader } from "$ui/components";
  import { installPageTransitions, RevealManager } from "$ui/motion";

  let { children } = $props();

  installPageTransitions();
</script>

<svelte:head>
  {#if siteConfig.sampleMode}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<a class="skip-link" href="#main-content">本文へ移動</a>
{#if siteConfig.sampleMode}<SampleBanner />{/if}
<SiteHeader navigation={primaryNavigation} pathname={page.url.pathname} />
<main id="main-content">
  {@render children()}
</main>
{#if page.url.pathname !== "/"}<SiteFooter />{/if}
<SettingsPanel />
<RevealManager />

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
