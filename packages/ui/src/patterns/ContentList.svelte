<script lang="ts">
  import type { Content, ContentType } from "@lunacea/schemas";
  import type { Snippet } from "svelte";
  import { TagLabel } from "../components";
  import { cn } from "../utils.ts";
  import type { ArticleCompositionVisual } from "../visuals/article-composition-types.ts";
  import ReadingLength from "./ReadingLength.svelte";

  export type ContentListEntry = {
    slug: string;
    type: ContentType;
    title: string;
    publishedAt: string;
    number?: string;
    href?: string;
    label?: string;
    summary?: string;
    hasMedia?: boolean;
    mediaTransitionName?: string;
    titleTransitionName?: string;
    composition?: ArticleCompositionVisual;
  };

  let {
    entries,
    showType = false,
    embedded = false,
    media,
  }: {
    entries: ContentListEntry[];
    showType?: boolean;
    embedded?: boolean;
    media?: Snippet<[ContentListEntry]>;
  } = $props();

  function contentHref(entry: Pick<Content, "type" | "slug">): string {
    if (entry.type === "article") return "/articles/" + entry.slug;
    if (entry.type === "work") return "/works/" + entry.slug;
    return "/archive/" + entry.type + "s/" + entry.slug;
  }
</script>

{#snippet record(entry: ContentListEntry)}
  <a
    class={cn(
      "group relative grid min-h-22 items-center border-t border-rule py-3 text-inherit no-underline transition-colors duration-(--motion-duration-micro) ease-standard hover:bg-paper focus-visible:bg-paper pointer-coarse:hover:bg-panel pointer-coarse:hover:text-inherit",
      entry.composition && "grid-cols-[minmax(0,1fr)_auto] gap-x-6",
    )}
    href={entry.href ?? contentHref(entry)}
    class:has-composition={Boolean(entry.composition)}
    data-content-list-record
    data-cursor="interactive"
    data-cursor-label={entry.type === "article" ? "Read more" : "View more"}
  >
    <div class="copy relative z-(--z-content) text-shadow-ui-mask">
      <div class="grid justify-items-start gap-2 text-(length:--text-caption) text-quiet tabular-nums group-hover:text-current group-focus-visible:text-current">
        {#if entry.number}<span class="text-ink tabular-nums">{entry.number}</span>{/if}
        {#if entry.label}<TagLabel tag={entry.label} />
        {:else if showType}<TagLabel tag={entry.type} />{/if}
        <time datetime={entry.publishedAt}>{entry.publishedAt}</time>
      </div>
      <h3 class="my-1 font-editorial text-(length:--text-h3) font-regular leading-heading transition-colors duration-(--motion-duration-fast) group-hover:text-signal group-focus-visible:text-signal" style:view-transition-name={entry.titleTransitionName}>{entry.title}</h3>
      {#if entry.summary}<p class="mt-1 mb-0 max-w-160 text-(length:--text-small) leading-compact text-quiet group-hover:text-current group-focus-visible:text-current">{entry.summary}</p>{/if}
    </div>
    {#if entry.composition}
      <ReadingLength class="relative z-(--z-content) flex-col items-center gap-1 group-hover:text-current group-focus-visible:text-current" composition={entry.composition} />
    {/if}
  </a>
{/snippet}

{#if embedded}
  {#each entries as entry}
    {@render record(entry)}
  {/each}
{:else}
  <ol class="content-list m-0 list-none border-b border-rule p-0">
    {#each entries as entry}
      <li data-reveal="line">{@render record(entry)}</li>
    {/each}
  </ol>
{/if}
