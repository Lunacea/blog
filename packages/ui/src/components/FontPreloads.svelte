<script lang="ts">
  import { fontPreloads } from "../../.generated/fonts/preloads.ts";
</script>

<svelte:head>
  {#each fontPreloads as href}
    <link rel="preload" as="font" type="font/woff2" {href} crossorigin="anonymous" />
  {/each}
</svelte:head>
