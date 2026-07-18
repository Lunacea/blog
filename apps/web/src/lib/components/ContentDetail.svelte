<script lang="ts">
  import type { Component } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import { linkPreviews } from "@lunacea/content/link-previews.ts";
  import type { Content } from "@lunacea/schemas";
  import { StatusBadge, TagLabel } from "$ui/components";
  import { Icon, interfaceIcons, socialIcons, tagIconName } from "$ui/icons";
  import { ContentList, ReadingSurface } from "$ui/patterns";
  import ReactionBar from "./ReactionBar.svelte";
  import ResponsiveImage from "./ResponsiveImage.svelte";

  let {
    metadata,
    component,
    headings = [],
    related = []
  }: {
    metadata: Content;
    component: Component;
    headings?: Array<{ id: string; text: string; level: number }>;
    related?: Content[];
  } = $props();
  let ContentComponent = $derived(component);

  const canonical = $derived(siteConfig.url +
    (metadata.type === "article"
      ? "/articles/"
      : metadata.type === "work"
      ? "/works/"
      : "/archive/" + metadata.type + "s/") +
    metadata.slug);

  const structured = $derived({
    "@context": "https://schema.org",
    "@type": metadata.type === "work" ? "SoftwareApplication" : "Article",
    headline: metadata.title,
    description: metadata.summary,
    datePublished: metadata.publishedAt,
    dateModified: metadata.updatedAt ?? metadata.publishedAt,
    author: { "@type": "Person", name: siteConfig.author.name },
    mainEntityOfPage: canonical
  });
  const mediaTransitionName = $derived(`record-media-${metadata.type}-${metadata.slug}`);
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
  <meta
    property="og:image"
    content={siteConfig.url + "/og/" + metadata.type + "/" + metadata.slug + ".png"}
  />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">{JSON.stringify(structured)}</script>
</svelte:head>

<article
  class:article-record={metadata.type === "article"}
  class:work-record={metadata.type === "work"}
>
  <header class="page shell content-shell article-header" data-reveal>
    {#if metadata.type === "article"}
      <div class="article-flags">
        <TagLabel tag={metadata.category} />
        <StatusBadge status={metadata.status} />
      </div>
    {:else}
      <div class="meta"><StatusBadge status={metadata.status} /></div>
    {/if}
    <h1>{metadata.title}</h1>
    <p class="lead">{metadata.summary}</p>
    {#if metadata.type === "article"}
      <dl class="article-dates">
        <div><dt>公開</dt><dd><time datetime={metadata.publishedAt}>{metadata.publishedAt}</time></dd></div>
        {#if metadata.updatedAt}
          <div><dt>更新</dt><dd><time datetime={metadata.updatedAt}>{metadata.updatedAt}</time></dd></div>
        {/if}
      </dl>
      <ul class="tag-list" aria-label="タグ">
        {#each metadata.tags as tag}
          <li><TagLabel {tag} href={"/tags/" + encodeURIComponent(tag)} /></li>
        {/each}
      </ul>
      {#if metadata.event}
        <dl class="event-meta">
          <div><dt>Event</dt><dd>{metadata.event.name}</dd></div>
          <div><dt>Held</dt><dd>{metadata.event.heldAt} / {metadata.event.mode}</dd></div>
          <div><dt>Format</dt><dd>{metadata.event.presentationType}</dd></div>
          {#if metadata.event.venue}<div><dt>Venue</dt><dd>{metadata.event.venue}</dd></div>{/if}
        </dl>
      {/if}
    {:else if metadata.type === "work"}
      <dl class="work-meta">
        <div><dt>Role</dt><dd>{metadata.role}</dd></div>
        <div><dt>Period</dt><dd>{metadata.period}</dd></div>
        <div><dt>Field</dt><dd>{metadata.fields.join(" / ")}</dd></div>
      </dl>
      <div class="work-technologies">
        <p>Technology</p>
        <ul aria-label="使用技術">
          {#each metadata.stack as technology}
            <li><Icon name={tagIconName(technology)} /><span>{technology}</span></li>
          {/each}
        </ul>
      </div>
      {#if metadata.links.github || metadata.links.site}
        <nav class="work-links" aria-label="制作物の外部リンク">
          {#if metadata.links.github}
            <a href={metadata.links.github} rel="noreferrer" target="_blank">
              <Icon name={socialIcons.github} /><span>View source</span>
            </a>
          {/if}
          {#if metadata.links.site}
            <a href={metadata.links.site} rel="noreferrer" target="_blank">
              <Icon name={interfaceIcons.externalLink} /><span>Visit site</span>
            </a>
          {/if}
        </nav>
      {/if}
      <ul class="tag-list" aria-label="タグ">
        {#each metadata.tags as tag}
          <li><TagLabel {tag} href={"/tags/" + encodeURIComponent(tag)} /></li>
        {/each}
      </ul>
    {:else}
      <ul class="tag-list" aria-label="タグ">
        {#each metadata.tags as tag}
          <li><TagLabel {tag} href={"/tags/" + encodeURIComponent(tag)} /></li>
        {/each}
      </ul>
    {/if}
  </header>

  {#if metadata.cover?.kind === "image" || metadata.cover?.kind === "og"}
    <figure class="cover shell content-shell" data-reveal="image" style:view-transition-name={mediaTransitionName}>
      <ResponsiveImage cover={{ ...metadata.cover, kind: "image" }} eager />
      {#if metadata.cover.kind === "image" && metadata.cover.caption}
        <figcaption>{metadata.cover.caption}</figcaption>
      {/if}
    </figure>
  {:else if metadata.cover?.kind === "placeholder"}
    <div
      class="cover-placeholder shell content-shell"
      style:aspect-ratio={metadata.cover.aspectRatio}
      data-asset-id={metadata.cover.assetId}
      aria-label="制作物画像は未設定です"
      role="img"
    >
      <span>Asset placeholder / {metadata.cover.assetId}</span>
    </div>
  {/if}

  <ReadingSurface component={ContentComponent} {headings} {linkPreviews} />

  <div class="shell article-tail">
    {#if metadata.revisions.length}
      <section class="revisions" aria-labelledby="revision-title" data-reveal>
        <h2 class="detail-section-title" id="revision-title">更新履歴</h2>
        <ol>
          {#each metadata.revisions as revision}
            <li><time datetime={revision.date}>{revision.date}</time><span>{revision.summary}</span></li>
          {/each}
        </ol>
      </section>
    {/if}
    <ReactionBar content={metadata} />
    {#if related.length}
      <section class="related" data-reveal>
        <h2 class="detail-section-title">関連記事</h2>
        <ContentList entries={related} showType />
      </section>
    {/if}
  </div>
</article>

<style>
  .article-header {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) minmax(0, 3fr);
    gap: var(--space-6) var(--space-12);
    min-height: auto;
    padding-bottom: clamp(var(--space-12), 7vw, var(--space-24));
  }

  .article-header h1 {
    max-width: 22ch;
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-h1);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-tight);
    text-wrap: balance;
  }

  .article-header .lead,
  .article-header .tag-list,
  .article-header .work-meta,
  .article-header .work-links,
  .article-header .event-meta {
    grid-column: 2;
  }

  .article-header .lead {
    margin-top: 0;
  }

  .cover {
    margin-bottom: var(--section-space);
  }

  .article-record .article-header {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    padding-bottom: var(--space-16);
  }

  .article-record .article-header .meta,
  .article-record .article-header .article-flags,
  .article-record .article-header h1,
  .article-record .article-header .lead,
  .article-record .article-header .article-dates,
  .article-record .article-header .tag-list,
  .article-record .article-header .event-meta {
    grid-column: 1;
    width: min(100%, var(--prose-width));
  }

  .article-record .article-header .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .article-flags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .article-dates {
    display: grid;
    gap: var(--space-1);
    margin: 0;
  }

  .article-dates div {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: var(--space-2);
  }

  .article-dates dt,
  .article-dates dd {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  .article-record .article-header h1 {
    max-width: 26ch;
    font-size: var(--text-h2);
    line-height: var(--leading-heading);
  }

  .article-record .article-header .lead {
    margin-top: var(--space-2);
  }

  .work-record .article-header {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    justify-items: start;
    gap: var(--space-5);
    padding-bottom: var(--space-10);
  }

  .work-record .article-header h1 {
    max-width: 22ch;
  }

  .work-record .article-header .lead {
    display: block;
  }

  .work-record .article-header .meta,
  .work-record .article-header h1,
  .work-record .article-header .lead,
  .work-record .article-header .work-meta,
  .work-record .article-header .work-technologies,
  .work-record .article-header .work-links,
  .work-record .article-header .tag-list {
    grid-column: 1;
    width: min(100%, var(--prose-width));
  }

  .work-record .cover {
    width: min(calc(100% - (2 * var(--layout-gutter))), 92rem);
  }

  .work-meta, .event-meta { display: grid; grid-template-columns: 1fr; gap: 0; margin: var(--space-2) 0 0; }
  .work-meta div, .event-meta div { border-top: 1px solid var(--color-line); padding-top: var(--space-2); }
  .work-meta div { display: grid; grid-template-columns: minmax(6rem, .22fr) 1fr; align-items: baseline; padding-block: var(--space-3); }
  .work-meta dt, .event-meta dt { color: var(--color-muted); font-size: var(--text-caption); }
  .work-meta dd, .event-meta dd { margin: var(--space-1) 0 0; }
  .work-technologies > p { margin: 0 0 var(--space-2); color: var(--color-muted); font-size: var(--text-caption); }
  .work-technologies ul { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
  .work-technologies li { display: inline-flex; min-height: var(--space-8); align-items: center; gap: var(--space-2); border: 1px solid var(--color-line); padding-inline: var(--space-2); font-size: var(--text-caption); }
  .work-technologies li :global(svg) { font-size: var(--text-small); }
  .work-links { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .work-links a { display: inline-flex; min-height: var(--control-size); align-items: center; gap: var(--space-2); border: 1px solid var(--color-line); padding-inline: var(--space-3); color: inherit; font-size: var(--text-small); text-decoration: none; }
  .work-links a:hover, .work-links a:focus-visible { color: var(--color-background); background: var(--color-foreground); }

  .cover :global(img) {
    width: 100%;
    max-height: 72svh;
    object-fit: cover;
  }

  .cover figcaption {
    margin-top: var(--space-2);
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  .cover-placeholder {
    display: grid;
    place-items: center;
    max-height: 72svh;
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    font-size: var(--text-caption);
  }

  .article-tail {
    padding-block: var(--section-space);
  }

  .revisions,
  .related {
    margin-top: var(--space-20);
  }

  .revisions:first-child {
    margin-top: 0;
  }

  .detail-section-title {
    margin: 0 0 var(--space-4);
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
  }

  .revisions ol {
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--color-line);
    list-style: none;
  }

  .revisions li {
    display: grid;
    grid-template-columns: 10rem 1fr;
    border-bottom: 1px solid var(--color-line);
    padding-block: var(--space-3);
    align-items: center;
  }

  .revisions time {
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    font-size: var(--text-caption);
  }

  @media (max-width: 44rem) {
    .article-header {
      grid-template-columns: 1fr;
    }

    .article-header .lead,
    .article-header .tag-list,
    .article-header .work-meta,
    .article-header .work-links,
    .article-header .event-meta {
      grid-column: 1;
    }

    .work-record .article-header {
      grid-template-columns: 1fr;
    }

    .revisions li {
      grid-template-columns: 1fr;
      gap: var(--space-1);
    }
  }

</style>
