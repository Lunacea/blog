<script lang="ts">
  import type { AuthoredMedia } from "@lunacea/config";

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
  class={`media-slot ${className}`}
  class:can-move={asset.allowMotion}
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
    <div class="placeholder" aria-hidden="true">
      <span>{label}</span>
    </div>
  {/if}
</figure>

<style>
  figure {
    position: relative;
    overflow: hidden;
    width: 100%;
    aspect-ratio: var(--media-aspect);
    margin: 0;
  }

  picture,
  img,
  .placeholder {
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: cover;
    object-position: var(--media-position);
    opacity: var(--media-opacity);
    filter: saturate(0.82) contrast(0.96);
  }

  .placeholder {
    position: relative;
    display: grid;
    place-items: end start;
    border: 1px solid var(--color-line);
    background:
      linear-gradient(135deg, transparent 49.8%, var(--color-line) 50%, transparent 50.2%),
      color-mix(in srgb, var(--color-surface) 56%, transparent);
  }

  .placeholder::before {
    position: absolute;
    inset: 12%;
    border: 1px solid var(--color-line);
    content: "";
  }

  .placeholder span {
    position: relative;
    margin: var(--space-3);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  @media (max-width: 44rem) {
    img {
      object-position: var(--media-mobile-position);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html[data-motion="full"]) .can-move img {
      transition: filter var(--motion-duration-base) var(--motion-ease-standard);
    }
  }
</style>
