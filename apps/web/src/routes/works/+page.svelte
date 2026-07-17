<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { siteConfig } from "@lunacea/config";
  import { parseFilterQuery, updateFilterQuery } from "@lunacea/core/filter-query.ts";
  import { FilterSelector, ViewToggle } from "$ui/components";
  import { WorkPreview } from "$ui/patterns";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";

  let { data } = $props();
  const representativeFields: readonly string[] = siteConfig.catalogFilters.works.fields;
  const representativeTechnologies: readonly string[] = siteConfig.catalogFilters.works.technologies;
  const representativeStatuses: readonly string[] = siteConfig.catalogFilters.works.statuses;
  const statuses = ["stable", "growing", "fragment", "deprecated"];
  let enhanced = $state(false);
  let filters = $state({ q: "", field: "", technology: "", status: "", year: "", view: "grid" as "grid" | "list" });

  function readLocation(search = location.search) {
    const params = new URLSearchParams(search);
    const aliased = new URLSearchParams(params);
    if (!aliased.has("technology") && aliased.has("stack")) aliased.set("technology", aliased.get("stack") ?? "");
    const parsed = parseFilterQuery(`?${aliased}`, {
      field: data.fields,
      technology: data.stacks,
      status: statuses,
      year: data.years,
      view: ["grid", "list"],
    });
    filters = {
      q: (params.get("q") ?? "").trim().slice(0, 120),
      field: parsed.field ?? "",
      technology: parsed.technology ?? "",
      status: parsed.status ?? "",
      year: parsed.year ?? "",
      view: parsed.view === "list" ? "list" : "grid",
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
    history.pushState({}, "", updateFilterQuery(location.search, { q: filters.q, stack: "" }));
  }

  function href(overrides: Partial<typeof filters>): string {
    const next = { ...filters, ...overrides };
    return `/works${updateFilterQuery("", {
      q: next.q,
      field: next.field,
      technology: next.technology,
      status: next.status,
      year: next.year,
      view: next.view,
    })}`;
  }

  function matches(entry: typeof data.entries[number]): boolean {
    const query = filters.q.toLocaleLowerCase("ja");
    const text = [entry.title, entry.summary, entry.role, ...entry.fields, ...entry.stack, ...entry.tags]
      .join(" ").toLocaleLowerCase("ja");
    return (!query || text.includes(query)) &&
      (!filters.field || entry.fields.includes(filters.field)) &&
      (!filters.technology || entry.stack.includes(filters.technology)) &&
      (!filters.status || entry.status === filters.status) &&
      (!filters.year || entry.publishedAt.startsWith(filters.year));
  }

  onMount(() => {
    const handlePopstate = () => readLocation();
    enhanced = true;
    readLocation();
    addEventListener("popstate", handlePopstate);
    return () => removeEventListener("popstate", handlePopstate);
  });
</script>

<PageHead
  title={`Works — ${siteConfig.name}`}
  description="実装、研究、空間表現を、役割と技術、検証した問いとともに記録します。"
  path="/works"
/>

<div class="page shell">
  <header data-reveal>
    <p class="eyebrow">Catalog / Constructed</p>
    <h1 class="page-title">Works</h1>
    <p class="lead">問題、役割、設計判断、検証と反省を、画像とケーススタディで示します。</p>
  </header>

  <section class="catalog-controls" aria-label="制作物の検索と絞り込み">
    <form method="GET" role="search" onsubmit={apply}>
      <label for="work-query">制作物を検索</label>
      <div class="search-row">
        <input id="work-query" type="search" name="q" value={filters.q} maxlength="120" />
        <button type="submit">検索</button>
      </div>
    </form>

    <FilterSelector label="Field" options={representativeFields.map((field) => ({ label: field, href: href({ field: filters.field === field ? "" : field }), active: filters.field === field }))} />
    <FilterSelector label="Technology" options={representativeTechnologies.map((technology) => ({ label: technology, href: href({ technology: filters.technology === technology ? "" : technology }), active: filters.technology === technology }))} />
    <FilterSelector label="Status" options={representativeStatuses.map((status) => ({ label: status, href: href({ status: filters.status === status ? "" : status }), active: filters.status === status }))} />

    <details>
      <summary>年で絞り込む</summary>
      <FilterSelector label="Year" options={data.years.map((year) => ({ label: year, href: href({ year: filters.year === year ? "" : year }), active: filters.year === year }))} />
    </details>

    {#if filters.q || filters.field || filters.technology || filters.status || filters.year}<a class="clear" href="/works">条件を解除</a>{/if}
  </section>

  <div class="result-heading">
    <p>{data.entries.filter((entry) => !enhanced || matches(entry)).length} records</p>
    <ViewToggle value={filters.view} gridHref={href({ view: "grid" })} listHref={href({ view: "list" })} />
  </div>

  <ol class:grid={filters.view === "grid"} class:list={filters.view === "list"} class="work-collection">
    {#each data.entries as entry}
      {@const visible = !enhanced || matches(entry)}
      <li class:hidden={!visible}>
        <WorkPreview
          href={`/works/${entry.slug}`}
          title={entry.title}
          summary={entry.summary}
          role={entry.role}
          period={entry.period}
          status={entry.status}
          technologies={entry.stack}
          view={filters.view}
          mediaTransitionName={`record-media-work-${entry.slug}`}
        >
          {#snippet media()}
            {#if entry.cover.kind === "image" || entry.cover.kind === "og"}
              <ResponsiveImage cover={{ ...entry.cover, kind: "image" }} />
            {:else}
              <div class="asset-placeholder" style:aspect-ratio={entry.cover.aspectRatio} data-asset-id={entry.cover.assetId} role="img" aria-label="制作物画像は未設定です">
                <span>Asset placeholder</span><code>{entry.cover.assetId}</code>
              </div>
            {/if}
          {/snippet}
        </WorkPreview>
      </li>
    {/each}
  </ol>
</div>

<style>
  header { margin-bottom: var(--space-16); }
  .catalog-controls { display: grid; gap: var(--space-4); margin-bottom: var(--space-16); }
  form { display: grid; max-width: 46rem; gap: var(--space-2); }
  form > label, summary { color: var(--color-muted); font-size: var(--text-caption); letter-spacing: var(--tracking-ui); }
  .search-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  input, button { min-height: var(--control-size); border: 1px solid var(--color-line); background: var(--color-background); color: var(--color-foreground); font: inherit; }
  input { min-width: 0; padding-inline: var(--space-3); }
  button { padding-inline: var(--space-5); background: var(--color-foreground); color: var(--color-background); }
  details { width: fit-content; }
  summary { min-height: var(--control-size); cursor: pointer; }
  .clear { width: fit-content; color: var(--color-muted); font-size: var(--text-small); }
  .result-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-8); color: var(--color-muted); font-size: var(--text-caption); font-variant-numeric: tabular-nums; }
  .work-collection { margin: 0; padding: 0; list-style: none; }
  .work-collection li.hidden { display: none; }
  .asset-placeholder { display: grid; place-content: center; gap: var(--space-2); border: 1px solid var(--color-line); color: var(--color-muted); text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(var(--space-10), 7vw, var(--space-24)) clamp(var(--space-6), 5vw, var(--space-16)); }
  .list > li + li { margin-top: var(--space-2); }
  @media (max-width: 44rem) { .grid { grid-template-columns: 1fr; } }
</style>
