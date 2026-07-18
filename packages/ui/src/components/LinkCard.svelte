<script lang="ts">
  import { useLinkPreviews } from "./link-preview-context.ts";

  let {
    href,
    title,
    description,
    site,
    image,
    imageAlt = "",
  }: {
    href: string;
    title?: string;
    description?: string;
    site?: string;
    image?: string;
    imageAlt?: string;
  } = $props();
  const previews = useLinkPreviews();
  const cached = $derived(previews?.()[href]);
  const fallbackSite = $derived((() => {
    try {
      return new URL(href).hostname;
    } catch {
      return href;
    }
  })());
  const resolved = $derived({
    title: title ?? cached?.title ?? fallbackSite,
    description: description ?? cached?.description ?? href,
    site: site ?? cached?.site ?? fallbackSite,
    image: image ?? cached?.image,
  });
</script>

<a
  class="link-card"
  class:has-image={Boolean(resolved.image)}
  {href}
  rel="noreferrer"
  target="_blank"
  data-cursor="interactive"
  data-cursor-label="Open external"
>
  {#if resolved.image}<img src={resolved.image} alt={imageAlt} loading="lazy" />{/if}
  <span class="copy">
    <span class="site">{resolved.site}</span>
    <strong>{resolved.title}</strong>
    <span class="description">{resolved.description}</span>
  </span>
</a>

<style>
  .link-card {
    position: relative;
    z-index: calc(var(--z-controls) + 1);
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
    min-height: 9rem;
    margin-block: var(--space-8);
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    text-decoration: none;
    overflow: hidden;
  }

  .has-image {
    grid-template-columns: minmax(8rem, .72fr) minmax(0, 1.28fr);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .copy {
    display: grid;
    align-content: center;
    min-width: 0;
    gap: var(--space-1);
    padding: var(--space-4);
  }

  .site,
  .description {
    color: var(--color-muted);
  }

  .site {
    font-size: var(--text-caption);
    text-transform: uppercase;
  }

  strong {
    display: -webkit-box;
    overflow: hidden;
    font-weight: var(--weight-emphasis);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .description {
    display: -webkit-box;
    overflow: hidden;
    font-size: var(--text-small);
    line-height: var(--leading-card);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  @media (max-width: 34rem) {
    .link-card {
      min-height: 8rem;
    }
    .has-image {
      grid-template-columns: minmax(6.5rem, .7fr) minmax(0, 1.3fr);
    }
    .copy {
      padding: var(--space-3);
    }
    .description {
      -webkit-line-clamp: 1;
      line-clamp: 1;
    }
  }
</style>
