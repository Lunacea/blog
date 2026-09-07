<script lang="ts">
  import { onMount } from "svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import { createWeatherContext, loadFixedLocationWeather } from "$lib/weather-context.ts";
  import EditorialLight from "$ui/visuals/EditorialLight.svelte";
  import { HeaderSearch } from "$ui/components";
  import { IndexList } from "$ui/patterns";
  import { cn } from "$ui/utils.ts";
  import { siteConfig } from "@lunacea/config";

  let { data } = $props();
  const categories = $derived(data.facets?.categories ?? []);
  const tags = $derived(data.facets?.tags ?? []);
  const total = $derived(
    categories.reduce((sum: number, name: string) => sum + (data.facets?.categoryCounts?.[name] ?? 0), 0),
  );
  const sorts = [
    { label: "公開日", value: "published" },
    { label: "更新日", value: "updated" },
    { label: "関連度", value: "relevance" },
  ];

  // The rail is open in the markup so it works without JavaScript; narrow screens fold it once
  // the enhancement runs, because there it sits between the reader and the records.
  const weather = createWeatherContext();
  const condition = $derived($weather.visual);
  onMount(() => {
    const controller = new AbortController();
    void loadFixedLocationWeather(weather, controller.signal);
    return () => controller.abort();
  });

  let categoryOpen = $state(true);
  let sortOpen = $state(true);
  onMount(() => {
    const wide = matchMedia("(min-width: 52rem)");
    const apply = () => {
      categoryOpen = wide.matches;
      sortOpen = wide.matches;
    };
    apply();
    wide.addEventListener("change", apply);
    return () => wide.removeEventListener("change", apply);
  });

  type QueryState = { q?: string | null; category?: string | null; tag?: string | null; sort?: string | null };

  function href(overrides: QueryState = {}): string {
    const values: QueryState = {
      q: data.query || null,
      category: data.filters.category ?? null,
      tag: data.filters.tag ?? null,
      sort: data.sort === (data.query ? "relevance" : "published") ? null : data.sort,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
    return `/articles${params.size ? `?${params}` : ""}`;
  }

  /** Every filter group is its name followed by a rule that runs to the end of the column. */
  const legend =
    "m-0 shrink-0 font-stretch-84% text-folio leading-none tracking-folio text-quiet uppercase";
  const summary =
    "flex min-h-control cursor-pointer list-none items-center gap-x-(--space-3) [&::-webkit-details-marker]:hidden md:min-h-(--space-8) md:cursor-default";
  const railItem =
    "relative flex min-h-control items-baseline justify-between gap-x-(--space-3) font-stretch-88% text-small leading-none tracking-ui no-underline transition-colors duration-(--motion-duration-fast) ease-standard hover:text-ink hover:no-underline focus-visible:text-ink";
</script>

<PageHead
  title={`Articles — ${siteConfig.name}`}
  description="UI・UX、Web技術、グラフィックデザイン。設計と実装の考え方を綴ります。"
  path="/articles"
  robots={data.isFiltered ? "noindex,follow" : undefined}
/>

<EditorialLight {condition} />

<div class="pt-(--space-12) pb-(--section-space)">
  <div class="mx-auto grid w-full max-w-content grid-cols-1 gap-x-(--space-12) px-(--layout-gutter) md:grid-cols-[minmax(0,var(--index-rail-width))_minmax(0,1fr)]">
    <!-- Category is the primary axis, so it and the sort order both live in a persistent rail. -->
    <div class="mb-(--space-10) grid gap-y-(--space-8) self-start md:sticky md:top-(--space-20) md:mb-0">
      <nav aria-label="カテゴリ">
        <details class="rail-disclosure" bind:open={categoryOpen}>
          <summary class={summary}>
            <span class={legend}>Category</span>
            <span class="h-px flex-1 bg-ink" aria-hidden="true"></span>
            <span class="shrink-0 font-stretch-84% text-folio leading-none tracking-folio text-quiet uppercase md:hidden" aria-hidden="true">{categoryOpen ? "Close" : "Open"}</span>
          </summary>
          <ul class="m-0 grid list-none p-0 pb-(--space-2)">
            <li>
              <a class={cn(railItem, data.filters.category ? "text-quiet" : "font-strong text-ink")} href={href({ category: null })} aria-current={data.filters.category ? undefined : "true"}>
                <span>All</span><span class="tabular-nums">{total || data.entries.length}</span>
              </a>
            </li>
            {#each categories as category}
              <li>
                <a
                  class={cn(railItem, data.filters.category === category ? "font-strong text-ink" : "text-quiet")}
                  href={href({ category: data.filters.category === category ? null : category })}
                  aria-current={data.filters.category === category ? "true" : undefined}
                >
                  <span class="truncate uppercase">{category}</span>
                  <span class="tabular-nums">{data.facets?.categoryCounts?.[category] ?? 0}</span>
                </a>
              </li>
            {/each}
          </ul>
        </details>
      </nav>

      <nav aria-label="並び替え">
        <details class="rail-disclosure" bind:open={sortOpen}>
          <summary class={summary}>
            <span class={legend}>Sort</span>
            <span class="h-px flex-1 bg-rule" aria-hidden="true"></span>
            <span class="shrink-0 font-stretch-84% text-folio leading-none tracking-folio text-quiet uppercase md:hidden" aria-hidden="true">{sortOpen ? "Close" : "Open"}</span>
          </summary>
          <ul class="m-0 grid list-none p-0 pb-(--space-2)">
            {#each sorts as sort}
              <li>
                <a
                  class={cn(railItem, data.sort === sort.value ? "font-strong text-ink" : "text-quiet")}
                  href={href({ sort: sort.value })}
                  aria-current={data.sort === sort.value ? "true" : undefined}
                >{sort.label}</a>
              </li>
            {/each}
          </ul>
        </details>
      </nav>
    </div>

    <div class="min-w-0">
      <h1 class="m-0 mb-(--space-6) font-stretch-96% text-h3 leading-none font-strong tracking-heading uppercase">Articles</h1>

      {#if data.isFiltered}
        <p class="m-0 mb-(--space-4) flex flex-wrap items-baseline gap-x-(--space-4) font-stretch-84% text-folio tracking-folio text-quiet uppercase">
          <span>Filtered</span>
          {#if data.query}<span>“{data.query}”</span>{/if}
          {#if data.filters.tag}<span>#{data.filters.tag}</span>{/if}
          <a class="min-h-control text-ink underline-offset-[.5em]" href={href({ q: null, category: null, tag: null, sort: null })}>Clear</a>
        </p>
      {/if}

      <h2 class="sr-only">記事の一覧</h2>
      {#if data.entries.length}
        <IndexList entries={data.entries} label="記事一覧" />
      {:else}
        <p class="border-t border-ink py-(--space-10) text-small text-quiet">条件に一致する記事はありません。条件を解除してもう一度お試しください。</p>
      {/if}
    </div>
  </div>

  <!-- Search and tags are the least used controls, so they close the page rather than open it. -->
  <aside class="mx-auto mt-(--home-section-space) grid w-full max-w-content gap-x-(--space-12) gap-y-(--space-10) px-(--layout-gutter) md:grid-cols-2" aria-label="記事の絞り込み">
    <div>
      <p class="flex items-center gap-x-(--space-3)"><span class={legend}>Search</span><span class="h-px flex-1 bg-rule" aria-hidden="true"></span></p>
      <h2 class="sr-only">記事を検索</h2>
      <div class="mt-(--space-4)"><HeaderSearch value={data.query} variant="static" /></div>
    </div>

    {#if tags.length}
      <div>
        <p class="flex items-center gap-x-(--space-3)"><span class={legend}>Tags</span><span class="h-px flex-1 bg-rule" aria-hidden="true"></span></p>
        <h2 class="sr-only">タグ</h2>
        <ul class="m-0 mt-(--space-4) flex list-none flex-wrap gap-x-(--space-4) gap-y-(--space-2) p-0">
          {#each tags as tag}
            <li>
              <a
                class={cn(
                  "inline-flex min-h-control items-center text-small no-underline underline-offset-[.5em] hover:underline",
                  data.filters.tag === tag ? "text-ink underline" : "text-quiet",
                )}
                href={href({ tag: data.filters.tag === tag ? null : tag })}
              >#{tag}</a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </aside>
</div>
