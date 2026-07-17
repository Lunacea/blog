<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import { FilterSelector, ViewToggle } from "$ui/components";
  import { ArticlePreview } from "$ui/patterns";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";

  let { data } = $props();
  const representativeCategories: readonly string[] = siteConfig.catalogFilters.articles.categories;
  const representativeTags: readonly string[] = siteConfig.catalogFilters.articles.tags;

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

<div class="page shell">
  <header data-reveal>
    <p class="eyebrow">Catalog / Knowledge</p>
    <h1 class="page-title">Articles</h1>
    <p class="lead">技術、研究、設計、考察を、完成度と更新状態を含む資料目録として残します。</p>
  </header>

  <section class="catalog-controls" aria-label="記事の検索と絞り込み" data-reveal>
    <form method="GET" role="search">
      <label for="article-query">記事を検索</label>
      <div class="search-row">
        <input id="article-query" type="search" name="q" value={data.query} maxlength="120" />
        {#if data.filters.category}<input type="hidden" name="category" value={data.filters.category} />{/if}
        {#if data.filters.tag}<input type="hidden" name="tag" value={data.filters.tag} />{/if}
        <input type="hidden" name="sort" value={data.sort} />
        <input type="hidden" name="view" value={data.view} />
        <button type="submit">検索</button>
      </div>
    </form>

    <div class="selectors">
      <FilterSelector
        label="Category"
        options={representativeCategories.map((category) => ({
          label: category,
          href: href({ category: data.filters.category === category ? null : category }),
          active: data.filters.category === category,
        }))}
      />
      <FilterSelector
        label="Tag"
        options={representativeTags.map((tag) => ({
          label: tag,
          href: href({ tag: data.filters.tag === tag ? null : tag }),
          active: data.filters.tag === tag,
        }))}
      />
    </div>

    <details class="secondary">
      <summary>並び順</summary>
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
    </details>

    {#if data.isFiltered}<a class="clear" href="/articles">条件を解除</a>{/if}
  </section>

  <div class="result-heading" aria-live="polite">
    <p>{data.entries.length} records{data.query ? ` / “${data.query}”` : ""}</p>
    <ViewToggle value={data.view} gridHref={href({ view: "grid" })} listHref={href({ view: "list" })} />
  </div>

  {#if data.entries.length}
    <ol class:grid={data.view === "grid"} class:list={data.view === "list"} class="article-collection">
      {#each data.entries as entry}
        {@const cover = entry.cover}
        <li>
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
  header { margin-bottom: var(--space-16); }

  .catalog-controls {
    display: grid;
    gap: var(--space-6);
    margin-bottom: var(--space-16);
  }

  form {
    display: grid;
    max-width: 46rem;
    gap: var(--space-2);
  }

  form > label,
  summary {
    color: var(--color-muted);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-ui);
  }

  .search-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  input,
  button {
    min-height: var(--control-size);
    border: 1px solid var(--color-line);
    background: var(--color-background);
    color: var(--color-foreground);
    font: inherit;
  }

  input { min-width: 0; padding-inline: var(--space-3); }
  button { padding-inline: var(--space-5); background: var(--color-foreground); color: var(--color-background); }

  .selectors { display: grid; gap: var(--space-2); }
  .secondary { width: fit-content; }
  .secondary summary { min-height: var(--control-size); cursor: pointer; }
  .clear { width: fit-content; color: var(--color-muted); font-size: var(--text-small); }

  .result-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  .article-collection {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .article-collection.grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(var(--space-10), 7vw, var(--space-24)) clamp(var(--space-6), 5vw, var(--space-16));
  }

  .list > li + li { margin-top: var(--space-2); }
  .empty { padding-block: var(--space-10); color: var(--color-muted); }

  @media (max-width: 44rem) {
    .article-collection.grid { grid-template-columns: 1fr; }
  }
</style>
