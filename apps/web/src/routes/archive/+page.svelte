<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { siteConfig } from "@lunacea/config";
  import { parseFilterQuery, updateFilterQuery } from "@lunacea/core/filter-query.ts";
  import { FilterSelector } from "$ui/components";
  import CatalogControls from "$lib/components/CatalogControls.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";

  let { data } = $props();
  const entries = $derived(data.groups.flatMap((group) => group.entries.map((entry) => ({ ...entry, kind: group.kind }))));
  const kinds = $derived(data.groups.map((group) => group.kind));
  const years = $derived([...new Set(entries.map((entry) => entry.publishedAt.slice(0, 4)))]);
  const tags = $derived([...new Set(entries.flatMap((entry) => entry.tags))].sort());
  const representativeTags: readonly string[] = siteConfig.catalogFilters.archive.tags;
  let enhanced = $state(false);
  let filters = $state({ q: "", kind: "", year: "", tag: "" });

  function readLocation(search = location.search) {
    const params = new URLSearchParams(search);
    const parsed = parseFilterQuery(search, { kind: kinds, year: years, tag: tags });
    filters = {
      q: (params.get("q") ?? "").trim().slice(0, 120),
      kind: parsed.kind ?? "",
      year: parsed.year ?? "",
      tag: parsed.tag ?? "",
    };
  }

  $effect(() => {
    const search = page.url.search;
    if (enhanced) readLocation(search);
  });

  function apply(event: SubmitEvent) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)) as Record<string, string>;
    filters.q = (values.q ?? "").trim().slice(0, 120);
    history.pushState({}, "", updateFilterQuery(location.search, { q: filters.q }));
  }

  function href(overrides: Partial<typeof filters>): string {
    const next = { ...filters, ...overrides };
    return `/archive${updateFilterQuery("", next)}`;
  }

  function matches(entry: typeof entries[number]): boolean {
    const query = filters.q.toLocaleLowerCase("ja");
    const text = [entry.title, entry.summary, ...entry.tags].join(" ").toLocaleLowerCase("ja");
    return (!query || text.includes(query)) &&
      (!filters.kind || entry.kind === filters.kind) &&
      (!filters.year || entry.publishedAt.startsWith(filters.year)) &&
      (!filters.tag || entry.tags.includes(filters.tag));
  }

  const activeFilterCount = $derived(
    [filters.q, filters.kind, filters.year, filters.tag].filter(Boolean).length,
  );

  onMount(() => {
    const handlePopstate = () => readLocation();
    enhanced = true;
    readLocation();
    addEventListener("popstate", handlePopstate);
    return () => removeEventListener("popstate", handlePopstate);
  });
</script>

<PageHead
  title={`Archive — ${siteConfig.name}`}
  description="写真、場所、ワイン、瞬間を、時間と場所の手掛かりとともに残す個人アーカイブ。"
  path="/archive"
/>

<div class="page shell content-shell catalog-page">
  <header class="archive-header" data-reveal>
    <h1 class="page-title">Archive</h1>
  </header>

  <CatalogControls
    searchId="archive-query"
    searchLabel="記録を検索"
    searchValue={filters.q}
    resultCount={entries.filter((entry) => !enhanced || matches(entry)).length}
    {activeFilterCount}
    clearHref={filters.q || filters.kind || filters.year || filters.tag
      ? href({ q: "", kind: "", year: "", tag: "" })
      : undefined}
    onsubmit={apply}
  >
    <FilterSelector label="Kind" options={kinds.map((kind) => ({ label: kind, href: href({ kind: filters.kind === kind ? "" : kind }), active: filters.kind === kind, count: entries.filter((entry) => entry.kind === kind).length }))} />
    <FilterSelector label="Tag" options={(representativeTags.length ? representativeTags : tags).map((tag) => ({ label: tag, href: href({ tag: filters.tag === tag ? "" : tag }), active: filters.tag === tag, count: entries.filter((entry) => entry.tags.includes(tag)).length }))} />
    <FilterSelector label="Year" options={years.map((year) => ({ label: year, href: href({ year: filters.year === year ? "" : year }), active: filters.year === year, count: entries.filter((entry) => entry.publishedAt.startsWith(year)).length }))} />
  </CatalogControls>

  <div class="preview-grid">
    {#each entries as entry, index}
      {@const visible = !enhanced || matches(entry)}
      <a class:hidden={!visible} href={`/archive/${entry.kind}/${entry.slug}`}>
        {#if entry.cover}
          <figure data-reveal="image" data-ratio={index % 3}><ResponsiveImage cover={entry.cover} /></figure>
        {/if}
        <span class="date">{entry.kind} / {entry.publishedAt}</span>
        <h2>{entry.title}</h2>
        <p>{entry.summary}</p>
      </a>
    {/each}
  </div>
</div>

<style>
  .archive-header { margin-bottom: var(--space-10); }
  .date { color: var(--color-muted); font-size: var(--text-caption); font-variant-numeric: tabular-nums; }
  .preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(var(--space-8), 6vw, var(--space-20)); }
  .preview-grid a { display: block; align-self: start; text-decoration: none; }
  .preview-grid a.hidden { display: none; }
  figure { overflow: hidden; margin: 0; aspect-ratio: 4 / 3; background: var(--color-surface); }
  figure[data-ratio="1"] { aspect-ratio: 3 / 4; }
  figure[data-ratio="2"] { aspect-ratio: 16 / 10; }
  .date { display: block; margin-top: var(--space-4); }
  h2 { margin: var(--space-1) 0; font-family: var(--font-serif); font-size: var(--text-h3); font-weight: var(--weight-regular); }
  .preview-grid p { max-width: 34rem; margin: 0; color: var(--color-muted); }
  @media (max-width: 52rem) { .preview-grid { grid-template-columns: 1fr; } figure, figure[data-ratio="1"], figure[data-ratio="2"] { aspect-ratio: 4 / 3; } }
</style>
