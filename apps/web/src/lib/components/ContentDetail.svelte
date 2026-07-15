<script lang="ts">
  import type { Component } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import type { Content } from "@lunacea/schemas";
  import ContentList from "$ui/ContentList.svelte";
  import StatusBadge from "$ui/StatusBadge.svelte";
  import ReactionBar from "./ReactionBar.svelte";
  import ReadingEnhancements from "./ReadingEnhancements.svelte";

  let {
    metadata,
    component,
    related = []
  }: {
    metadata: Content;
    component: Component;
    related?: Content[];
  } = $props();
  let ContentComponent = $derived(component);

  const canonical = $derived(siteConfig.url +
    (metadata.type === "article"
      ? "/articles/"
      : metadata.type === "work"
      ? "/works/"
      : metadata.type === "talk"
      ? "/talks/"
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
  const transitionName = $derived(`record-${metadata.type}-${metadata.slug}`);
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

<article>
  <header class="page shell article-header" data-reveal>
    <div class="meta">
      <p class="eyebrow">{metadata.type} / {metadata.publishedAt}</p>
      <StatusBadge status={metadata.status} />
    </div>
    <h1 style:view-transition-name={transitionName}>{metadata.title}</h1>
    <p class="lead">{metadata.summary}</p>
    <ul class="tag-list" aria-label="タグ">
      {#each metadata.tags as tag}
        <li><a class="tag" href={"/tags/" + encodeURIComponent(tag)}>{tag}</a></li>
      {/each}
    </ul>
  </header>

  {#if metadata.cover}
    <figure class="cover shell" data-reveal="image">
      <img
        src={metadata.cover.src}
        alt={metadata.cover.alt}
        width={metadata.cover.width}
        height={metadata.cover.height}
        style:view-transition-name={`record-media-${metadata.type}-${metadata.slug}`}
      />
    </figure>
  {/if}

  <div class="reading-surface">
    <div class="shell article-grid">
      <div class="prose"><ContentComponent /></div>
      <ReadingEnhancements />
    </div>
  </div>

  <div class="shell article-tail">
    {#if metadata.revisions.length}
      <section class="revisions" aria-labelledby="revision-title" data-reveal>
        <p class="eyebrow">Changelog</p>
        <h2 id="revision-title">更新履歴</h2>
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
        <div class="section-heading"><h2>Related records</h2></div>
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
    font-size: var(--text-h1);
    font-weight: 480;
    letter-spacing: var(--tracking-heading);
    line-height: 1.04;
    text-wrap: balance;
  }

  .article-header .lead,
  .article-header .tag-list {
    grid-column: 2;
  }

  .article-header .lead {
    margin-top: 0;
  }

  .cover {
    margin-bottom: var(--section-space);
  }

  .cover img {
    width: 100%;
    max-height: 72svh;
    object-fit: cover;
  }

  .reading-surface {
    border-block: 1px solid var(--color-line);
    padding-block: var(--section-space);
    background: var(--color-surface);
  }

  .article-grid {
    display: grid;
    grid-template-columns: minmax(0, var(--prose-width)) minmax(12rem, 1fr);
    justify-content: space-between;
    gap: clamp(var(--space-8), 8vw, 8rem);
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

  .revisions h2 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-h3);
    font-weight: 600;
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
  }

  .revisions time {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  @media (max-width: 60rem) {
    .article-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 44rem) {
    .article-header {
      grid-template-columns: 1fr;
    }

    .article-header .lead,
    .article-header .tag-list {
      grid-column: 1;
    }

    .revisions li {
      grid-template-columns: 1fr;
      gap: var(--space-1);
    }
  }
</style>
