<script lang="ts">
  import { fontPreloads } from "@lunacea/ui/fonts";
</script>

<svelte:head>
  {#each fontPreloads as href}
    <link rel="preload" as="font" type="font/woff2" {href} crossorigin="anonymous" />
  {/each}
</svelte:head>
