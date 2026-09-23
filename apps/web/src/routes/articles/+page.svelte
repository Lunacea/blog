<script lang="ts">
  import { onMount } from "svelte";
  import PageHead from "$lib/PageHead.svelte";
  import SearchForm from "$lib/articles/SearchForm.svelte";
  import { DisclosureGlyph } from "@lunacea/ui/icons";
  import IndexList from "$lib/articles/IndexList.svelte";
  import { cn } from "@lunacea/ui/utils";
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

  const filtered = $derived([
    data.query ? `“${data.query}”` : null,
    data.filters.category ?? null,
    data.filters.tag ? `#${data.filters.tag}` : null,
  ].filter((value) => value !== null));

  // JavaScript なしでも使えるよう初期状態は開いておき、狭い画面では拡張実行後に畳む。
  let categoryOpen = $state(true);
  onMount(() => {
    const wide = matchMedia("(min-width: 52rem)");
    const apply = () => {
      categoryOpen = wide.matches;
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

  const folio = "m-0 shrink-0 font-stretch-84% text-folio leading-none tracking-folio text-quiet uppercase";
  const legend = cn(
    folio,
    "transition-colors duration-(--motion-duration-base) ease-signature group-hover/rail:text-ink group-focus-visible/rail:text-ink",
  );
  /*
   * ラベルとその罫線を囲む枠は一覧の先頭行と衝突するため、フォーカスは
   * ラベルの濃度と罫線の太さで示す。形を足さない。
   */
  const summary =
    "group/rail flex min-h-control cursor-pointer list-none items-center gap-x-(--space-3) pressable [--press-duration:var(--motion-duration-response)] [--press-ease:var(--motion-ease-response)] [--press-scale:0.99] focus-visible:outline-none [&::-webkit-details-marker]:hidden md:min-h-(--space-8) md:cursor-default";
  const legendRule =
    "h-px flex-1 bg-rule transition-[height,background-color] duration-(--motion-duration-base) ease-signature group-hover/rail:bg-ink group-focus-visible/rail:h-0.5 group-focus-visible/rail:bg-ink";
  /*
   * 絞り込みと並びの選択子はタグと同じ組み方にする。濃度で現在地を示し、罫は語の下だけに引く。
   * レールは数を右端に置くため行が伸びるので、罫は行ではなく語の span が持つ。
   */
  const control =
    "no-underline pressable [--press-scale:0.98] hover:text-ink hover:no-underline focus-visible:text-ink active:text-ink";
  const choice = cn(control, "ink-underline inline-flex min-h-control items-center text-small");
  /*
   * 並びは状態の行と一覧のあいだに同じ一歩で置きたいので、箱は字の高さに畳み、
   * 押せる範囲だけを擬似要素で広げる。上下の余りが出ないぶん、間隔を margin で決められる。
   */
  const sortItem = cn(
    control,
    "ink-underline inline-flex items-center text-small before:absolute before:-inset-y-(--space-4) before:inset-x-0 before:content-['']",
  );
  /*
   * 解除は状態ではなく取り消しなので、唯一、面で押す形にして選択子と見分けられるようにする。
   * 地に天候の絵があるため、面は透かさず紙で塗る。押すとインクが入れ替わる。
   */
  const clear =
    "group/clear inline-flex min-h-control items-center text-small text-ink no-underline pressable [--press-duration:var(--motion-duration-micro)] [--press-ease:var(--motion-ease-standard)] [--press-scale:0.96] hover:text-canvas hover:no-underline focus-visible:text-canvas";
  const clearFace =
    "inline-flex items-center rounded-sharp border border-rule bg-(--color-glass) px-(--space-3) py-(--space-2) leading-none backdrop-blur-glass transition-colors duration-(--motion-duration-micro) ease-standard group-hover/clear:border-ink group-hover/clear:bg-ink group-focus-visible/clear:border-ink group-focus-visible/clear:bg-ink";
  const railItem = cn(
    control,
    "ink-underline flex min-h-control items-center justify-between gap-x-(--space-3) font-stretch-88% text-small leading-none tracking-ui",
  );
</script>

<PageHead
  title={`Articles — ${siteConfig.name}`}
  description="UI・UX、Web技術、グラフィックデザイン。設計と実装の考え方を綴ります。"
  path="/articles"
  robots={data.isFiltered ? "noindex,follow" : undefined}
/>

<div class="pt-(--space-12) pb-(--section-space)">
  <!-- 見出しは常に最初に読む。レールが上に来る幅でも、題字を先頭へ置く。 -->
  <div class="mx-auto grid w-full max-w-content grid-cols-1 gap-x-(--space-12) px-(--layout-gutter) md:grid-cols-[minmax(0,1fr)_minmax(0,var(--index-rail-width))] md:grid-rows-[auto_minmax(0,1fr)]">
    <h1 class="m-0 mb-(--space-4) font-stretch-96% text-h3 leading-none font-strong tracking-heading uppercase md:col-start-1 md:row-start-1">Articles</h1>

    <div class="mb-(--space-10) grid gap-y-(--space-6) self-start md:sticky md:top-(--space-20) md:col-start-2 md:row-span-2 md:mb-0 md:row-start-1">
      <nav aria-label="カテゴリ">
        <details class="rail-disclosure" bind:open={categoryOpen}>
          <summary class={summary}>
            <span class={legend}>Category</span>
            <span class={legendRule} aria-hidden="true"></span>
            <span class="inline-grid size-(--space-8) shrink-0 place-items-center rounded-sharp border border-rule bg-panel text-ink transition-colors duration-(--motion-duration-response) ease-response group-hover/rail:border-ink group-hover/rail:bg-ink group-hover/rail:text-canvas group-focus-visible/rail:border-ink group-focus-visible/rail:bg-ink group-focus-visible/rail:text-canvas md:hidden" aria-hidden="true"><DisclosureGlyph class="size-(--space-5)" /></span>
          </summary>
          <ul class="m-0 mt-(--space-4) grid list-none p-0">
            <li>
              <a class={cn(railItem, data.filters.category ? "text-quiet" : "text-ink")} href={href({ category: null })} aria-current={data.filters.category ? undefined : "true"}>
                <span>All</span><span class="tabular-nums">{total || data.entries.length}</span>
              </a>
            </li>
            {#each categories as category}
              <li>
                <a
                  class={cn(railItem, data.filters.category === category ? "text-ink" : "text-quiet")}
                  href={href({ category: data.filters.category === category ? null : category })}
                  aria-current={data.filters.category === category ? "true" : undefined}
                >
                  <span class="uppercase">{category}</span>
                  <span class="tabular-nums">{data.facets?.categoryCounts?.[category] ?? 0}</span>
                </a>
              </li>
            {/each}
          </ul>
        </details>
      </nav>
    </div>

    <div class="min-w-0 md:col-start-1 md:row-start-2">
      <!--
        見出しはノンブル、値は本文の濃さ。ラベルと中身が同じ組みだと読み分けられない。
        条件の有無で一覧が上下しないよう、この行は空のときも場所を空けたまま置く。
      -->
      <p class="m-0 flex min-h-control flex-wrap items-center gap-x-(--space-4) gap-y-(--space-1)">
        {#if data.isFiltered && filtered.length}
          <span class={folio}>Filtered</span>
          {#each filtered as value}<span class="text-small leading-none text-ink">{value}</span>{/each}
          <a class={clear} href={href({ q: null, category: null, tag: null })}>
            <span class={clearFace}>条件を解除</span>
          </a>
        {/if}
      </p>

      <h2 class="sr-only">記事の一覧</h2>

      <!--
        並びは絞り込みではないので状態の行とは別に立てる。ラベルはどちらも左端から始め、
        状態から並び、並びから一覧までを同じ一歩でつなぐ。
      -->
      <nav class="mb-(--space-4) flex flex-wrap items-center gap-x-(--space-4) gap-y-(--space-4)" aria-label="並び替え">
        <span class={folio}>Sort</span>
        <ul class="m-0 flex list-none flex-wrap items-center gap-x-(--space-4) p-0">
          {#each sorts as sort}
            <li>
              <a
                class={cn(sortItem, data.sort === sort.value ? "text-ink" : "text-quiet")}
                href={href({ sort: sort.value })}
                aria-current={data.sort === sort.value ? "true" : undefined}
              >{sort.label}</a>
            </li>
          {/each}
        </ul>
      </nav>

      {#if data.entries.length}
        <IndexList entries={data.entries} label="記事一覧" bleed="compact" />
      {:else}
        <p class="border-t border-ink py-(--space-10) text-small text-quiet">条件に一致する記事はありません。条件を解除してもう一度お試しください。</p>
      {/if}
    </div>
  </div>

  <aside class="mx-auto mt-(--home-section-space) grid w-full max-w-content gap-x-(--space-12) gap-y-(--space-10) px-(--layout-gutter) md:grid-cols-2" aria-label="記事の絞り込み">
    <div>
      <p class="flex items-center gap-x-(--space-3)"><span class={legend}>Search</span><span class="h-px flex-1 bg-rule" aria-hidden="true"></span></p>
      <h2 class="sr-only">記事を検索</h2>
      <div class="mt-(--space-4)"><SearchForm value={data.query} /></div>
    </div>

    {#if tags.length}
      <div>
        <p class="flex items-center gap-x-(--space-3)"><span class={legend}>Tags</span><span class="h-px flex-1 bg-rule" aria-hidden="true"></span></p>
        <h2 class="sr-only">タグ</h2>
        <ul class="m-0 mt-(--space-4) flex list-none flex-wrap gap-x-(--space-4) gap-y-(--space-2) p-0">
          {#each tags as tag}
            <li>
              <a
                class={cn(choice, data.filters.tag === tag ? "text-ink" : "text-quiet")}
                href={href({ tag: data.filters.tag === tag ? null : tag })}
                aria-current={data.filters.tag === tag ? "true" : undefined}
              >#{tag}</a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </aside>
</div>
