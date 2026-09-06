<script lang="ts">
  import type { ImageCover } from "@lunacea/schemas";

  export type ResponsiveImageVariant = { width: number; avif: string; webp: string };

  let {
    cover,
    variants = [],
    eager = false,
    sizes = "(max-width: 52rem) 100vw, 50vw",
    class: className = "",
  }: {
    cover: ImageCover;
    variants?: ReadonlyArray<ResponsiveImageVariant>;
    eager?: boolean;
    sizes?: string;
    class?: string;
  } = $props();
</script>

<picture class={["block size-full", className]}>
  {#if variants.length}
    <source type="image/avif" srcset={variants.map((item) => `${item.avif} ${item.width}w`).join(", ")} {sizes} />
    <source type="image/webp" srcset={variants.map((item) => `${item.webp} ${item.width}w`).join(", ")} {sizes} />
  {/if}
  <img
    class="block size-full object-cover"
    src={cover.src}
    alt={cover.alt}
    width={cover.width}
    height={cover.height}
    loading={eager ? "eager" : "lazy"}
    fetchpriority={eager ? "high" : "auto"}
  />
</picture>
