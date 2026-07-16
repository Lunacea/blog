<script lang="ts">
  import { responsiveImages } from "$lib/.generated/images.ts";
  import type { ImageCover } from "@lunacea/schemas";

  let { cover, eager = false, sizes = "(max-width: 52rem) 100vw, 50vw" }: {
    cover: ImageCover;
    eager?: boolean;
    sizes?: string;
  } = $props();
  const variants = $derived(responsiveImages[cover.src as keyof typeof responsiveImages] ?? []);
</script>

<picture>
  {#if variants.length}
    <source type="image/avif" srcset={variants.map((item) => `${item.avif} ${item.width}w`).join(", ")} {sizes} />
    <source type="image/webp" srcset={variants.map((item) => `${item.webp} ${item.width}w`).join(", ")} {sizes} />
  {/if}
  <img src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} loading={eager ? "eager" : "lazy"} fetchpriority={eager ? "high" : "auto"} />
</picture>

<style>
  picture { display: block; width: 100%; height: 100%; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style>
