<script lang="ts">
  import { CategoryLabel, StatusBadge, TagLabel } from "$ui/components";
import { IndexList } from "$ui/patterns";
  import { BackGlyph } from "$ui/icons";
  import { ContentDetailView, ReadingSurface } from "$ui/patterns";
  import { siteConfig } from "@lunacea/config";
  import { hrefForContent } from "@lunacea/content";
import { linkPreviews } from "@lunacea/content/link-previews.ts";
  import type { Article } from "@lunacea/schemas";
  import { onMount, type Component } from "svelte";
  import type { ArticleCompositionVisual } from "$ui/visuals";
  import { recordImpression } from "$lib/impressions.ts";
  import ReactionBar from "./ReactionBar.svelte";
  import ResponsiveImage from "./ResponsiveImage.svelte";
  import { ShareActions } from "$ui/components";
  import { cn } from "$ui/utils.ts";

  let {
    metadata,
    component,
    headings = [],
    related = [],
    composition,
  }: {
    metadata: Article;
    component?: Component;
    headings?: Array<{ id: string; text: string; level: number }>;
    related?: Article[];
    composition?: ArticleCompositionVisual;
  } = $props();
  let ContentComponent = $derived(component);

  const canonical = $derived(`${siteConfig.url}/articles/${metadata.slug}`);
  const structured = $derived({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: metadata.title,
    description: metadata.summary,
    datePublished: metadata.publishedAt,
    dateModified: metadata.updatedAt ?? metadata.publishedAt,
    author: { "@type": "Person", name: siteConfig.author.name },
    mainEntityOfPage: canonical,
  });
  onMount(() => recordImpression(metadata.type, metadata.slug));

</script>

<svelte:head>
  <title>{metadata.title} — {siteConfig.name}</title>
  <meta name="description" content={metadata.summary} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={metadata.title} />
  <meta property="og:description" content={metadata.summary} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content={siteConfig.name} />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={`${siteConfig.url}/og/${metadata.type}/${metadata.slug}.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">{JSON.stringify(structured)}</script>
</svelte:head>

<ContentDetailView
  contentId={`${metadata.type}:${metadata.slug}`}
  canonicalUrl={canonical}
  kind={metadata.type}
  class={cn(
    "[&_.article-header]:grid [&_.article-header]:min-h-0 [&_.article-header]:grid-cols-1 [&_.article-header]:content-start [&_.article-header]:gap-3 [&_.article-header]:pb-12 [&_.article-header>*]:w-[min(100%,var(--prose-width))] [&_h1]:m-0 [&_h1]:max-w-[24ch] [&_h1]:text-balance [&_h1]:font-interface [&_h1]:text-(length:--text-h1) [&_h1]:font-strong [&_h1]:leading-tight [&_h1]:tracking-(--tracking-heading) [&_.article-flags]:flex [&_.article-flags]:flex-wrap [&_.article-flags]:items-center [&_.article-flags]:gap-2 [&_.article-flags]:leading-none [&_.detail-flags]:flex [&_.detail-flags]:flex-wrap [&_.detail-flags]:items-center [&_.detail-flags]:justify-between [&_.detail-flags]:gap-2 [&_.lead]:m-0 [&_.lead]:max-w-prose [&_.lead]:leading-copy [&_.tag-list]:m-0 [&_.tag-list]:flex [&_.tag-list]:list-none [&_.tag-list]:flex-wrap [&_.tag-list]:items-center [&_.tag-list]:gap-1 [&_.tag-list]:p-0 [&_.tag-list]:leading-none",
    "[&_.article-back]:inline-flex [&_.article-back]:w-fit [&_.article-back]:items-center [&_.article-back]:gap-(--space-2) [&_.article-back]:text-(length:--text-folio) [&_.article-back]:tracking-(--tracking-folio) [&_.article-back]:uppercase [&_.article-back]:text-quiet [&_.article-back]:no-underline [&_.article-back]:transition-colors [&_.article-back]:duration-(--motion-duration-fast) hover:[&_.article-back]:text-ink focus-visible:[&_.article-back]:text-ink",
    "[&_.article-byline]:mt-1 [&_.article-byline]:flex [&_.article-byline]:flex-wrap [&_.article-byline]:items-center [&_.article-byline]:justify-between [&_.article-byline]:gap-x-6 [&_.article-byline]:gap-y-3 [&_.article-byline]:border-t [&_.article-byline]:border-rule [&_.article-byline]:pt-3 [&_.article-byline]:leading-ui",
    "[&_.compact-dates]:m-0 [&_.compact-dates]:flex [&_.compact-dates]:flex-wrap [&_.compact-dates]:items-baseline [&_.compact-dates]:gap-x-5 [&_.compact-dates]:gap-y-1 [&_.compact-dates]:leading-ui [&_.compact-dates>div]:flex [&_.compact-dates>div]:items-baseline [&_.compact-dates>div]:gap-2 [&_.compact-dates_dt]:m-0 [&_.compact-dates_dt]:text-(length:--text-folio) [&_.compact-dates_dt]:tracking-(--tracking-folio) [&_.compact-dates_dt]:uppercase [&_.compact-dates_dt]:text-quiet [&_.compact-dates_dd]:m-0 [&_.compact-dates_dd]:text-(length:--text-folio) [&_.compact-dates_dd]:tracking-(--tracking-folio) [&_.compact-dates_dd]:text-quiet [&_.compact-dates_dd]:tabular-nums",
    "[&_.event-meta]:mt-3 [&_.event-meta]:grid [&_.event-meta]:gap-1 [&_.event-meta]:leading-ui [&_.event-meta>div]:grid [&_.event-meta>div]:grid-cols-[5rem_minmax(0,1fr)] [&_.event-meta>div]:gap-2 [&_.event-meta_dt]:m-0 [&_.event-meta_dt]:text-(length:--text-folio) [&_.event-meta_dt]:tracking-(--tracking-folio) [&_.event-meta_dt]:uppercase [&_.event-meta_dt]:text-quiet [&_.event-meta_dd]:m-0 [&_.event-meta_dd]:text-(length:--text-small)",
    "[&_.cover]:m-0 [&_.cover_img]:max-h-[72svh] [&_.cover_img]:w-full [&_.cover_img]:object-cover [&_.cover_figcaption]:mt-2 [&_.cover_figcaption]:text-(length:--text-caption) [&_.cover_figcaption]:text-quiet [&_.article-cover]:mb-section",
    "[&_.article-reading]:border-b-0 [&_.article-reading]:pb-(--space-12) [&_.engagement]:mt-(--space-10) [&_.engagement]:grid [&_.engagement]:justify-items-center [&_.engagement]:gap-4",
    "[&_.article-tail]:pb-section [&_.revisions]:mt-section [&_.related]:mt-section [&_.detail-section-title]:mb-4 [&_.detail-section-title]:font-interface [&_.detail-section-title]:font-stretch-74% [&_.detail-section-title]:text-(length:--text-folio) [&_.detail-section-title]:tracking-(--tracking-folio) [&_.detail-section-title]:uppercase [&_.revisions_ol]:m-0 [&_.revisions_ol]:list-none [&_.revisions_ol]:border-t [&_.revisions_ol]:border-rule [&_.revisions_ol]:p-0 [&_.revisions_li]:grid [&_.revisions_li]:grid-cols-[10rem_1fr] [&_.revisions_li]:items-center [&_.revisions_li]:border-b [&_.revisions_li]:border-rule [&_.revisions_li]:py-3 max-sm:[&_.revisions_li]:grid-cols-1 max-sm:[&_.revisions_li]:gap-1 [&_.revisions_time]:text-(length:--text-folio) [&_.revisions_time]:tracking-(--tracking-folio) [&_.revisions_time]:text-quiet [&_.revisions_time]:tabular-nums [&_.revisions_li]:text-(length:--text-small)",
    metadata.type === "article" && "[&_h1]:text-(length:--text-h2) [&_h1]:leading-heading",
  )}
>
  {#if metadata.type === "article"}
    <header class="page content-shell article-header" data-reveal>
      <a class="article-back" href="/articles" data-sveltekit-noscroll>
        <BackGlyph />記事一覧へ
      </a>
      <div class="article-flags">
        <CategoryLabel category={metadata.category} href={`/articles?category=${encodeURIComponent(metadata.category)}`} />
        <StatusBadge status={metadata.status} />
      </div>
      <h1>{metadata.title}</h1>
      <p class="lead">{metadata.summary}</p>
      <div class="article-byline">
        <dl class="article-dates compact-dates">
          <div><dt>公開</dt><dd><time datetime={metadata.publishedAt}>{metadata.publishedAt}</time></dd></div>
          {#if metadata.updatedAt}<div><dt>更新</dt><dd><time datetime={metadata.updatedAt}>{metadata.updatedAt}</time></dd></div>{/if}
        </dl>
      </div>
      <ul class="tag-list" aria-label="タグ">
        {#each metadata.tags as tag}
          <li><TagLabel {tag} href={`/articles?tag=${encodeURIComponent(tag)}`} /></li>
        {/each}
      </ul>
      {#if metadata.event}
        <dl class="event-meta">
          <div><dt>イベント</dt><dd>{metadata.event.name}</dd></div>
          <div><dt>開催</dt><dd>{metadata.event.heldAt} / {metadata.event.mode}</dd></div>
          <div><dt>形式</dt><dd>{metadata.event.presentationType}</dd></div>
          {#if metadata.event.venue}<div><dt>会場</dt><dd>{metadata.event.venue}</dd></div>{/if}
        </dl>
      {/if}
    </header>

    {#if metadata.cover}
      <figure class="cover article-cover content-shell" data-reveal="image">
        <ResponsiveImage cover={metadata.cover} eager />
        {#if metadata.cover.caption}<figcaption>{metadata.cover.caption}</figcaption>{/if}
      </figure>
    {/if}
  {/if}

  {#if ContentComponent}
    <ReadingSurface
      component={ContentComponent}
      {headings}
      {linkPreviews}
      {composition}
      class="article-reading"
    >
      {#snippet tools()}
        <ShareActions title={metadata.title} url={canonical} class="border-t border-rule pt-(--space-4)" />
      {/snippet}
    </ReadingSurface>
  {/if}

  <div class="shell article-tail">
    <div class="engagement">
      <ReactionBar content={metadata} />
      <ShareActions title={metadata.title} url={canonical} class="justify-center lg:hidden" />
    </div>
    {#if metadata.revisions.length}
      <section class="revisions" aria-labelledby="revision-title" data-reveal>
        <h2 class="detail-section-title" id="revision-title">更新履歴</h2>
        <ol>{#each metadata.revisions as revision}<li><time datetime={revision.date}>{revision.date}</time><span>{revision.summary}</span></li>{/each}</ol>
      </section>
    {/if}
    {#if metadata.type === "article" && related.length}
      <section class="related" data-reveal>
        <h2 class="detail-section-title">関連記事</h2>
        <IndexList
          label="関連記事"
          entries={related.map((entry) => ({
            slug: entry.slug,
            href: hrefForContent(entry),
            title: entry.title,
            summary: entry.summary,
            category: entry.category,
            publishedAt: entry.publishedAt,
            tags: entry.tags,
          }))}
        />
      </section>
    {/if}
  </div>


</ContentDetailView>
