<script lang="ts">
  import { responsiveImages } from "$lib/.generated/images.ts";
  import { ResponsivePicture } from "$ui/components";
  import type { ImageCover } from "@lunacea/schemas";

  let { cover, eager = false, sizes = "(max-width: 52rem) 100vw, 50vw" }: {
    cover: ImageCover;
    eager?: boolean;
    sizes?: string;
  } = $props();
  const variants = $derived(responsiveImages[cover.src as keyof typeof responsiveImages] ?? []);
</script>

<ResponsivePicture {cover} {variants} {eager} {sizes} />
