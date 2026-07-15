<script lang="ts">
  import "../app.css";
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import SampleBanner from "$ui/SampleBanner.svelte";
  import SettingsPanel from "$ui/SettingsPanel.svelte";
  import SiteFooter from "$ui/SiteFooter.svelte";
  import SiteHeader from "$ui/SiteHeader.svelte";
  import RevealManager from "$lib/components/RevealManager.svelte";

  let { children } = $props();

  onNavigate((navigation) => {
    if (!("startViewTransition" in document)) return;
    if (document.documentElement.dataset.motion !== "full") return;
    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#0c110f" />
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
    z-index: 100;
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
