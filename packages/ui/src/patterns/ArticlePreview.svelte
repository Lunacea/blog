<script lang="ts">
  import type { Snippet } from "svelte";
  import TagLabel from "../components/TagLabel.svelte";
  import { cn } from "../utils.ts";
  import type { ArticleCompositionVisual } from "../visuals/article-composition-types.ts";
  import type { ArticlePreviewVariant } from "./article-preview-variant.ts";
  import ContentList from "./ContentList.svelte";
  import ReadingLength from "./ReadingLength.svelte";

  let {
    variant = "column",
    href,
    title,
    summary,
    category,
    publishedAt,
    tags,
    hasMedia = false,
    media,
    mediaTransitionName,
    titleTransitionName,
    composition,
  }: {
    variant?: ArticlePreviewVariant;
    href: string;
    title: string;
    summary: string;
    category: string;
    publishedAt: string;
    tags: readonly string[];
    hasMedia?: boolean;
    media?: Snippet;
    mediaTransitionName?: string;
    titleTransitionName?: string;
    composition?: ArticleCompositionVisual;
  } = $props();
</script>

{#if variant === "list"}
  <ContentList
    embedded
    entries={[{
      href,
      slug: href.split("/").filter(Boolean).at(-1) ?? href,
      type: "article",
      title,
      publishedAt,
      label: category,
      hasMedia,
      mediaTransitionName,
      titleTransitionName,
      composition,
    }]}
    {media}
  />
{:else}
<a
  class={cn(
    "group relative block h-full text-inherit no-underline",
    variant === "lead" && hasMedia && media &&
      "grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start",
  )}
  {href}
  data-cursor="interactive"
  data-cursor-label="Read more"
  data-article-preview={variant}
>
  {#if hasMedia && media && variant !== "compact"}
    <figure class={cn("m-0 overflow-hidden bg-panel", variant === "lead" ? "aspect-4/3 lg:order-2" : "mb-4 aspect-16/10")} style:view-transition-name={mediaTransitionName}>
      {@render media()}
    </figure>
  {/if}
  <div class="copy relative z-(--z-content) flex h-full flex-col gap-2 text-shadow-ui-mask">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-(length:--text-caption) text-quiet tabular-nums">
      <TagLabel tag={category} />
      <time datetime={publishedAt}>{publishedAt}</time>
    </div>
    <h3
      class={cn(
        "m-0 font-editorial font-regular text-balance transition-colors duration-(--motion-duration-fast) group-hover:text-signal group-focus-visible:text-signal",
        variant === "lead" && "text-h2 leading-tight tracking-(--tracking-heading)",
        variant === "column" && "text-h3 leading-heading",
        variant === "compact" && "text-(length:--text-body) leading-heading",
      )}
      style:view-transition-name={titleTransitionName}
    >{title}</h3>
    {#if variant !== "compact"}
      <p class={cn(
        "m-0 text-quiet",
        variant === "lead" ? "max-w-[46ch] text-(length:--text-body) leading-relaxed" : "text-(length:--text-small) leading-compact",
      )}>{summary}</p>
    {/if}
    {#if composition || variant === "lead"}
      <div class="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-1">
        {#if variant === "lead" && tags.length}
          <ul class="m-0 flex min-w-0 list-none flex-wrap gap-1 p-0 text-(length:--text-caption) text-quiet" aria-label="代表タグ">
            {#each tags.slice(0, 3) as tag}<li><TagLabel {tag} /></li>{/each}
          </ul>
        {/if}
        {#if composition}<ReadingLength class="ml-auto" {composition} />{/if}
      </div>
    {/if}
  </div>
</a>
{/if}
