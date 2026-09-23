<script lang="ts">
  import SettingsPanel from "$lib/preferences/SettingsPanel.svelte";
  import SiteHeader from "$lib/shell/SiteHeader.svelte";
  import ThemeToggle from "$lib/preferences/ThemeToggle.svelte";

  let { navigation, pathname }: { navigation: ReadonlyArray<{ href: string; label: string }>; pathname: string } = $props();
</script>

<SiteHeader {navigation} {pathname}>
  {#snippet theme()}<ThemeToggle />{/snippet}
  {#snippet display()}<SettingsPanel />{/snippet}
</SiteHeader>
<main class="min-h-[120vh] px-gutter py-section"><p>Header controls follow document scrolling without becoming a horizontal bar.</p></main>
