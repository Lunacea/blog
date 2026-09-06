<script lang="ts">
  import type { AuthoredMedia } from "@lunacea/config";
  import AssetPlaceholder from "./AssetPlaceholder.svelte";
  import { cn } from "../utils.ts";

  let {
    asset,
    showPlaceholder = false,
    label = "Authored media slot",
    class: className = ""
  }: {
    asset: AuthoredMedia;
    showPlaceholder?: boolean;
    label?: string;
    class?: string;
  } = $props();
</script>

<figure
  class={cn(
    "relative m-0 aspect-(--media-aspect) w-full overflow-hidden [&>picture]:size-full [&>img]:size-full [&_.asset-placeholder]:size-full [&_img]:object-cover [&_img]:object-(--media-position) [&_img]:opacity-(--media-opacity) [&_img]:filter-[saturate(.82)_contrast(.96)] max-sm:[&_img]:object-(--media-mobile-position)",
    asset.allowMotion && "motion-full:motion-safe:[&_img]:transition-[filter] motion-full:motion-safe:[&_img]:duration-(--motion-duration-base) motion-full:motion-safe:[&_img]:ease-standard",
    className,
  )}
  data-variant={asset.variant}
  style={`--media-aspect:${asset.aspectRatio};--media-position:${asset.objectPosition};--media-mobile-position:${asset.mobileObjectPosition ?? asset.objectPosition};--media-opacity:${asset.opacity}`}
>
  {#if asset.src}
    <picture>
      {#each asset.sources ?? [] as source}
        <source srcset={source.srcset} type={source.type} media={source.media} />
      {/each}
      <img
        src={asset.src}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        loading={asset.loading}
        decoding="async"
      />
    </picture>
  {:else if showPlaceholder}
    <AssetPlaceholder
      assetId={asset.placeholder.assetId}
      role={`${label}: ${asset.placeholder.role}`}
      aspectRatio={asset.aspectRatio}
      preferredFileType={asset.placeholder.preferredFileType}
      accessibilityDescription={asset.placeholder.accessibilityDescription}
      transparencyRequired={asset.placeholder.transparencyRequired}
    />
  {/if}
</figure>
