<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import { FilterSelector, ViewToggle } from "$ui/components";
  import { ArticlePreview } from "$ui/patterns";
  import CatalogControls from "$lib/components/CatalogControls.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";

  let { data } = $props();
  const categories = $derived(data.facets?.categories ?? siteConfig.catalogFilters.articles.categories);
  const tags = $derived(data.facets?.tags ?? siteConfig.catalogFilters.articles.tags);
  const activeFilterCount = $derived(
    Number(Boolean(data.query)) + Number(Boolean(data.filters.category)) +
      Number(Boolean(data.filters.tag)) + Number(data.sort !== "published"),
  );

  type QueryState = {
    q?: string | null;
    category?: string | null;
    tag?: string | null;
    sort?: string | null;
    view?: "grid" | "list" | null;
  };

  function href(overrides: QueryState = {}): string {
    const values: QueryState = {
      q: data.query || null,
      category: data.filters.category ?? null,
      tag: data.filters.tag ?? null,
      sort: data.sort === (data.query ? "relevance" : "published") ? null : data.sort,
      view: data.view,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
    return `/articles${params.size ? `?${params}` : ""}`;
  }
</script>

<PageHead
  title={`Articles — ${siteConfig.name}`}
  description="技術、研究、設計、考察を、完成度と更新状態を含む資料目録として残します。"
  path="/articles"
  robots={data.isFiltered ? "noindex,follow" : undefined}
/>

<div class="page shell content-shell catalog-page article-catalog">
  <header data-reveal>
    <h1 class="page-title">Articles</h1>
  </header>

  <CatalogControls
    searchId="article-query"
    searchLabel="記事を検索"
    searchValue={data.query}
    resultCount={data.entries.length}
    {activeFilterCount}
    hiddenFields={[
      ...(data.filters.category ? [{ name: "category", value: data.filters.category }] : []),
      ...(data.filters.tag ? [{ name: "tag", value: data.filters.tag }] : []),
      { name: "sort", value: data.sort },
      { name: "view", value: data.view },
    ]}
    clearHref={data.isFiltered ? href({
      q: null,
      category: null,
      tag: null,
      sort: null,
      view: data.view,
    }) : undefined}
  >
    <div class="selectors">
      <FilterSelector
        label="Category"
        options={categories.map((category: string) => ({
          label: category,
          href: href({ category: data.filters.category === category ? null : category }),
          active: data.filters.category === category,
          count: data.facets?.categoryCounts?.[category],
        }))}
      />
      <FilterSelector
        label="Tag"
        options={tags.map((tag: string) => ({
          label: tag,
          href: href({ tag: data.filters.tag === tag ? null : tag }),
          active: data.filters.tag === tag,
          count: data.facets?.tagCounts?.[tag],
        }))}
      />
    </div>

    <FilterSelector
      label="Sort"
      options={[
        { label: "関連度", value: "relevance" },
        { label: "公開日", value: "published" },
        { label: "更新日", value: "updated" },
      ].map((sort) => ({
        label: sort.label,
        href: href({ sort: sort.value }),
        active: data.sort === sort.value,
      }))}
    />
  </CatalogControls>

  <div class="result-heading" aria-live="polite">
    {#if data.query}<p>“{data.query}”</p>{/if}
    <ViewToggle value={data.view} gridHref={href({ view: "grid" })} listHref={href({ view: "list" })} />
  </div>

  {#if data.entries.length}
    <ol class:grid={data.view === "grid"} class:list={data.view === "list"} class="article-collection">
      {#each data.entries as entry}
        {@const cover = entry.cover}
        <li style:view-transition-name={`catalog-article-${entry.slug}`}>
          <ArticlePreview
            href={entry.href}
            title={entry.title}
            summary={entry.summary}
            category={entry.category ?? "article"}
            publishedAt={entry.publishedAt}
            tags={entry.tags}
            view={data.view}
            hasMedia={Boolean(cover)}
            mediaTransitionName={`record-media-article-${entry.slug}`}
          >
            {#snippet media()}{#if cover}<ResponsiveImage {cover} />{/if}{/snippet}
          </ArticlePreview>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="empty">条件に一致する記事はありません。条件を解除してもう一度お試しください。</p>
  {/if}
</div>

<style>
  header { margin-bottom: var(--space-10); }

  .selectors { display: grid; gap: var(--space-2); }

  .result-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  .result-heading:has(:only-child) { justify-content: flex-end; }

  .article-collection {
    position: relative;
    isolation: isolate;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .article-collection.grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(var(--space-10), 7vw, var(--space-24)) clamp(var(--space-6), 5vw, var(--space-16));
  }

  .list { border-bottom: 1px solid var(--color-line); }
  .empty { padding-block: var(--space-10); color: var(--color-muted); }

  @media (max-width: 44rem) {
    .article-collection.grid { grid-template-columns: 1fr; }
  }


  @media (forced-colors: active), print {
    :global(body:has(.article-catalog)) { background-image: none; }
  }
</style>
