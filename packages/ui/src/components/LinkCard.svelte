<script lang="ts">
  import { useLinkPreviews } from "./link-preview-context.ts";
  import { cn } from "../utils.ts";

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
  class={cn(
    "link-card",
    "relative z-[calc(var(--z-controls)+1)] my-8 grid min-h-36 grid-cols-1 items-stretch overflow-hidden border border-rule bg-panel no-underline max-xs:min-h-32",
    resolved.image && "grid-cols-[minmax(8rem,.72fr)_minmax(0,1.28fr)] max-xs:grid-cols-[minmax(6.5rem,.7fr)_minmax(0,1.3fr)]",
  )}
  {href}
  rel="noreferrer"
  target="_blank"
  data-cursor="interactive"
  data-cursor-label="Open external"
>
  {#if resolved.image}
    <span class="preview-media grid size-full place-items-center bg-canvas p-2 max-xs:p-1">
      <img class="max-h-full max-w-full object-contain" src={resolved.image} alt={imageAlt} loading="lazy" />
    </span>
  {/if}
  <span class="copy grid min-w-0 content-center gap-1 p-4 max-xs:p-3">
    <span class="text-(length:--text-caption) text-quiet uppercase">{resolved.site}</span>
    <strong class="line-clamp-2 overflow-hidden font-emphasis">{resolved.title}</strong>
    <span class="line-clamp-2 overflow-hidden text-(length:--text-small) leading-card text-quiet max-xs:line-clamp-1">{resolved.description}</span>
  </span>
</a>
