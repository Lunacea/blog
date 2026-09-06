<script lang="ts">
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";
  import { LinkSelector } from "$ui/components";
  import { interfaceIcons } from "$ui/icons";
  import { ArticlePreview, CatalogControls } from "$ui/patterns";
  import { cn } from "$ui/utils.ts";
  import { siteConfig } from "@lunacea/config";

  let { data } = $props();
  const categories = $derived(data.facets?.categories ?? siteConfig.catalogFilters.articles.categories);
  const tags = $derived(data.facets?.tags ?? siteConfig.catalogFilters.articles.tags);
  const activeFilterCount = $derived(
    Number(Boolean(data.query)) + Number(Boolean(data.filters.category)) +
      Number(Boolean(data.filters.tag)) + Number(data.sort !== "published"),
  );

  const newspaper = $derived(data.view === "grid");
  const picked = $derived(new Set(newspaper ? data.serendipity ?? [] : []));
  const front = $derived(newspaper ? data.entries.slice(0, 2) : []);
  const serendipity = $derived(data.entries.filter((entry) => picked.has(entry.slug)));
  const rest = $derived(
    newspaper ? data.entries.slice(2).filter((entry) => !picked.has(entry.slug)) : data.entries,
  );
  const dateline = $derived(
    [...data.entries].map((entry) => entry.publishedAt).sort().at(-1) ?? "",
  );
  // A ranking only claims to be one once impressions exist; until then the rail indexes the rest.
  const ranked = $derived(newspaper && (data.ranking ?? []).some((item) => item.impressions > 0));
  const railEntries = $derived(
    ranked
      ? (data.ranking ?? []).flatMap((item) => {
        const entry = data.entries.find((candidate) => candidate.slug === item.slug);
        return entry ? [{ entry, impressions: item.impressions }] : [];
      })
      : rest.map((entry) => ({ entry, impressions: 0 })),
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
      view: data.view === "list" ? "list" : null,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
    return `/articles${params.size ? `?${params}` : ""}`;
  }

  /** Column rules follow the responsive column count, so no rule ever opens a row. */
  function columnRule(index: number): string {
    return cn(
      index % 2 === 1 &&
        "sm:before:absolute sm:before:inset-y-0 sm:before:-left-4 sm:before:w-px sm:before:bg-rule sm:before:content-['']",
      index % 3 === 0
        ? "lg:before:hidden"
        : "lg:before:absolute lg:before:inset-y-0 lg:before:-left-4 lg:before:w-px lg:before:bg-rule lg:before:content-['']",
    );
  }
</script>

<PageHead
  title={`Articles — ${siteConfig.name}`}
  description="UI・UX、Web技術、グラフィックデザイン。設計と実装の考え方を綴ります。"
  path="/articles"
  robots={data.isFiltered ? "noindex,follow" : undefined}
/>

<div class="page content-shell catalog-page article-catalog" data-article-catalog>
  <header class="mb-8 grid gap-3">
    <div class="folio flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-2 text-(length:--text-caption) tracking-(--tracking-label) text-quiet uppercase">
      <h1 class="m-0 text-(length:--text-caption) font-label tracking-(--tracking-label) text-ink">Articles</h1>
      <p class="m-0 max-sm:hidden">UI・UX / Web Engineering / Graphic Design</p>
      <p class="m-0 tabular-nums">{data.entries.length}本{dateline ? ` / ${dateline}` : ""}</p>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule pb-2">
      <LinkSelector
        label="カテゴリ"
        display="strip"
        options={[
          {
            label: "すべて",
            href: href({ category: null }),
            active: !data.filters.category,
          },
          ...categories.map((category: string) => ({
            label: category,
            href: href({ category: data.filters.category === category ? null : category }),
            active: data.filters.category === category,
            count: data.facets?.categoryCounts?.[category],
          })),
        ]}
      />
      <LinkSelector
        label="表示形式"
        display="strip"
        options={[
          { label: "新聞", title: "新聞", href: href({ view: null }), active: newspaper, icon: interfaceIcons.grid },
          { label: "リスト", title: "リスト", href: href({ view: "list" }), active: !newspaper, icon: interfaceIcons.list },
        ]}
      />
    </div>
  </header>

  {#if !newspaper}
    <CatalogControls
      label="記事の絞り込み"
      resultCount={data.entries.length}
      {activeFilterCount}
      clearHref={data.isFiltered
        ? href({ q: null, category: null, tag: null, sort: null, view: "list" })
        : undefined}
    >
      <LinkSelector
        label="タグ"
        options={tags.map((tag: string) => ({
          label: tag,
          href: href({ tag: data.filters.tag === tag ? null : tag }),
          active: data.filters.tag === tag,
          count: data.facets?.tagCounts?.[tag],
        }))}
      />
      <LinkSelector
        label="並び替え"
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
  {:else if data.isFiltered}
    <p class="mb-8 flex flex-wrap items-center gap-3 text-(length:--text-caption) text-quiet tabular-nums" aria-live="polite">
      <span>{data.entries.length}件{data.query ? ` / “${data.query}”` : ""}</span>
      <a class="inline-flex min-h-8 items-center border border-rule bg-canvas px-2 no-underline hover:border-ink hover:bg-ink hover:text-canvas" href={href({ q: null, category: null, tag: null, sort: null })} data-sveltekit-noscroll>条件を解除</a>
    </p>
  {/if}

  {#if data.entries.length}
    <div class={cn(newspaper && railEntries.length > 0 && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:gap-x-8")}>
      <div class="min-w-0">
        {#if front.length}
          <section class="front-page mb-12" aria-labelledby="front-heading">
            <h2 class="sr-only" id="front-heading">主要記事</h2>
            <ol class="article-collection relative isolate m-0 grid list-none gap-y-8 p-0 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              {#each front as entry, index}
                {@const cover = entry.cover}
                <li
                  class={cn(
                    index === 0 && "lg:pr-8",
                    index > 0 && "border-t border-rule pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8",
                  )}
                  style:view-transition-name={`catalog-article-${entry.slug}`}
                >
                  <ArticlePreview
                    variant={index === 0 ? "lead" : "column"}
                    href={entry.href}
                    title={entry.title}
                    summary={entry.summary}
                    category={entry.category ?? "article"}
                    publishedAt={entry.publishedAt}
                    tags={entry.tags}
                    hasMedia={Boolean(cover)}
                    mediaTransitionName={`record-media-article-${entry.slug}`}
                    titleTransitionName={`record-title-article-${entry.slug}`}
                    composition={entry.composition}
                  >
                    {#snippet media()}{#if cover}<ResponsiveImage {cover} eager={index === 0} />{/if}{/snippet}
                  </ArticlePreview>
                </li>
              {/each}
            </ol>
          </section>
        {/if}

        {#if serendipity.length}
          <aside class="serendipity mb-12" aria-labelledby="serendipity-heading">
            <h2 class="m-0 mb-5 border-b border-ink pb-2 text-(length:--text-small) font-label tracking-(--tracking-label)" id="serendipity-heading">本日のPick Up</h2>
            <ol class="article-collection m-0 grid list-none gap-x-8 gap-y-6 p-0 sm:grid-cols-2">
              {#each serendipity as entry, index}
                <li class={cn("relative", index % 2 === 1 && "sm:before:absolute sm:before:inset-y-0 sm:before:-left-4 sm:before:w-px sm:before:bg-rule sm:before:content-['']")} style:view-transition-name={`catalog-article-${entry.slug}`}>
                  <ArticlePreview
                    variant="compact"
                    href={entry.href}
                    title={entry.title}
                    summary={entry.summary}
                    category={entry.category ?? "article"}
                    publishedAt={entry.publishedAt}
                    tags={entry.tags}
                    titleTransitionName={`record-title-article-${entry.slug}`}
                    composition={entry.composition}
                  />
                </li>
              {/each}
            </ol>
          </aside>
        {/if}

        {#if !newspaper && rest.length}
          <section aria-labelledby="rest-heading">
            <h2 class="m-0 mb-5 border-b border-ink pb-2 text-(length:--text-small) font-label tracking-(--tracking-label)" id="rest-heading">記事一覧</h2>
            <ol class="article-collection relative isolate m-0 list-none border-b border-rule p-0">
              {#each rest as entry}
                <li style:view-transition-name={`catalog-article-${entry.slug}`}>
                  <ArticlePreview
                    variant="list"
                    href={entry.href}
                    title={entry.title}
                    summary={entry.summary}
                    category={entry.category ?? "article"}
                    publishedAt={entry.publishedAt}
                    tags={entry.tags}
                    hasMedia={Boolean(entry.cover)}
                    mediaTransitionName={`record-media-article-${entry.slug}`}
                    titleTransitionName={`record-title-article-${entry.slug}`}
                    composition={entry.composition}
                  />
                </li>
              {/each}
            </ol>
          </section>
        {/if}
      </div>

      {#if newspaper && railEntries.length}
        <aside class="article-rail max-lg:mt-4 lg:border-l lg:border-rule lg:pl-8" aria-labelledby="rail-heading">
          <h2 class="m-0 mb-4 border-b border-ink pb-2 text-(length:--text-small) font-label tracking-(--tracking-label)" id="rail-heading">
            {ranked ? "ランキング" : "そのほかの記事"}
          </h2>
          <ol class="article-collection ranking-list m-0 grid list-none gap-0 p-0">
            {#each railEntries as item, index}
              <li class="border-b border-rule" style:view-transition-name={`catalog-rail-${item.entry.slug}`}>
                <a class={cn("group grid items-baseline gap-x-3 py-3 text-inherit no-underline", ranked && "grid-cols-[1.5rem_minmax(0,1fr)]")} href={item.entry.href} data-cursor="interactive" data-cursor-label="Read more">
                  {#if ranked}<span class="font-editorial text-(length:--text-h3) leading-none text-quiet tabular-nums group-hover:text-signal">{index + 1}</span>{/if}
                  <span class="grid gap-1">
                    <span class="font-editorial text-(length:--text-small) leading-heading text-balance transition-colors duration-(--motion-duration-fast) group-hover:text-signal group-focus-visible:text-signal">{item.entry.title}</span>
                    <span class="flex items-baseline gap-2 text-(length:--text-caption) text-quiet tabular-nums">
                      <time datetime={item.entry.publishedAt}>{item.entry.publishedAt}</time>
                      {#if ranked}<span>{item.impressions}回表示</span>{/if}
                    </span>
                  </span>
                </a>
              </li>
            {/each}
          </ol>
        </aside>
      {/if}
    </div>
  {:else}
    <p class="py-10 text-quiet">条件に一致する記事はありません。条件を解除してもう一度お試しください。</p>
  {/if}
</div>
