<script lang="ts">
  import SettingsPanel from "./SettingsPanel.svelte";
  import SiteHeader from "./SiteHeader.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";

  let { navigation, pathname }: { navigation: ReadonlyArray<{ href: string; label: string }>; pathname: string } = $props();
</script>

<SiteHeader {navigation} {pathname}>
  {#snippet theme()}<ThemeToggle />{/snippet}
  {#snippet display()}<SettingsPanel />{/snippet}
</SiteHeader>
<main><p>Header controls follow document scrolling without becoming a horizontal bar.</p></main>

<style>
  main { min-height: 120vh; padding: var(--section-space) var(--layout-gutter); }
</style>
