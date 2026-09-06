<script lang="ts">
  import { siteConfig } from "@lunacea/config";

  let {
    title,
    description,
    path,
    image = "/og/site.png",
    robots
  }: {
    title: string;
    description: string;
    path: string;
    image?: string;
    robots?: string;
  } = $props();

  const canonical = $derived(siteConfig.url + path);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  {#if robots}<meta name="robots" content={robots} />{/if}
  <link rel="canonical" href={canonical} />
  <meta property="og:site_name" content={siteConfig.name} />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={siteConfig.url + image} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
