<script lang="ts">
  import { page } from "$app/state";
  import CatalogControls from "$lib/components/CatalogControls.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";
  import { contentStatusLabel, FilterSelector, ViewToggle } from "$ui/components";
  import { WorkPreview } from "$ui/patterns";
  import { siteConfig } from "@lunacea/config";
  import {
    parseFilterQuery,
    updateFilterQuery,
  } from "@lunacea/core/filter-query.ts";
  import { onMount } from "svelte";

  let { data } = $props();
  const representativeFields: readonly string[] =
    siteConfig.catalogFilters.works.fields;
  const representativeTechnologies: readonly string[] =
    siteConfig.catalogFilters.works.technologies;
  const representativeStatuses: readonly string[] =
    siteConfig.catalogFilters.works.statuses;
  const statuses = ["stable", "growing", "fragment", "deprecated"];
  let enhanced = $state(false);
  let filters = $state({
    q: "",
    field: "",
    technology: "",
    status: "",
    year: "",
    view: "grid" as "grid" | "list",
  });

  function readLocation(search = location.search) {
    const params = new URLSearchParams(search);
    const aliased = new URLSearchParams(params);
    if (!aliased.has("technology") && aliased.has("stack"))
      aliased.set("technology", aliased.get("stack") ?? "");
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
    const values = Object.fromEntries(
      new FormData(event.currentTarget as HTMLFormElement),
    ) as Record<string, string>;
    filters.q = (values.q ?? "").trim().slice(0, 120);
    history.pushState(
      {},
      "",
      updateFilterQuery(location.search, { q: filters.q, stack: "" }),
    );
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

  function matches(entry: (typeof data.entries)[number]): boolean {
    const query = filters.q.toLocaleLowerCase("ja");
    const text = [
      entry.title,
      entry.summary,
      entry.role,
      ...entry.fields,
      ...entry.stack,
      ...entry.tags,
    ]
      .join(" ")
      .toLocaleLowerCase("ja");
    return (
      (!query || text.includes(query)) &&
      (!filters.field || entry.fields.includes(filters.field)) &&
      (!filters.technology || entry.stack.includes(filters.technology)) &&
      (!filters.status || entry.status === filters.status) &&
      (!filters.year || entry.publishedAt.startsWith(filters.year))
    );
  }

  function fieldCount(field: string) {
    return data.entries.filter((entry) => entry.fields.includes(field)).length;
  }

  function technologyCount(technology: string) {
    return data.entries.filter((entry) => entry.stack.includes(technology))
      .length;
  }

  function statusCount(status: string) {
    return data.entries.filter((entry) => entry.status === status).length;
  }

  const activeFilterCount = $derived(
    [
      filters.q,
      filters.field,
      filters.technology,
      filters.status,
      filters.year,
    ].filter(Boolean).length,
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
  title={`Works — ${siteConfig.name}`}
  description="実装、研究、空間表現を、役割と技術、検証した問いとともに記録します。"
  path="/works"
/>

<div class="page shell content-shell catalog-page">
  <header data-reveal>
    <h1 class="page-title">Works</h1>
  </header>

  <CatalogControls
    searchId="work-query"
    searchLabel="制作物を検索"
    searchValue={filters.q}
    resultCount={data.entries.filter((entry) => !enhanced || matches(entry))
      .length}
    {activeFilterCount}
    clearHref={filters.q ||
    filters.field ||
    filters.technology ||
    filters.status ||
    filters.year
      ? href({
        q: "",
        field: "",
        technology: "",
        status: "",
        year: "",
        view: filters.view,
      })
      : undefined}
    onsubmit={apply}
  >
    <FilterSelector
      label="Field"
      options={(representativeFields.length
        ? representativeFields
        : data.fields
      ).map((field) => ({
        label: field,
        href: href({ field: filters.field === field ? "" : field }),
        active: filters.field === field,
        count: fieldCount(field),
      }))}
    />
    <FilterSelector
      label="Technology"
      options={(representativeTechnologies.length
        ? representativeTechnologies
        : data.stacks
      ).map((technology) => ({
        label: technology,
        href: href({
          technology: filters.technology === technology ? "" : technology,
        }),
        active: filters.technology === technology,
        count: technologyCount(technology),
      }))}
    />
    <FilterSelector
      label="Status"
      options={(representativeStatuses.length
        ? representativeStatuses
        : statuses
      ).map((status) => ({
        label: contentStatusLabel(status as "stable" | "growing" | "fragment" | "deprecated"),
        href: href({ status: filters.status === status ? "" : status }),
        active: filters.status === status,
        count: statusCount(status),
      }))}
    />
    <FilterSelector
      label="Year"
      options={data.years.map((year) => ({
        label: year,
        href: href({ year: filters.year === year ? "" : year }),
        active: filters.year === year,
        count: data.entries.filter((entry) =>
          entry.publishedAt.startsWith(year),
        ).length,
      }))}
    />
  </CatalogControls>

  <div class="result-heading">
    <ViewToggle
      value={filters.view}
      gridHref={href({ view: "grid" })}
      listHref={href({ view: "list" })}
    />
  </div>

  <ol
    class:grid={filters.view === "grid"}
    class:list={filters.view === "list"}
    class="work-collection"
  >
    {#each data.entries as entry}
      {@const visible = !enhanced || matches(entry)}
      <li
        class:hidden={!visible}
        style:view-transition-name={`catalog-work-${entry.slug}`}
      >
        <WorkPreview
          href={`/works/${entry.slug}`}
          title={entry.title}
          role={entry.role}
          period={entry.period}
          status={entry.status}
          technologies={entry.stack}
          view={filters.view}
          hoverMedia={entry.cover.kind === "image" || entry.cover.kind === "og"}
          mediaTransitionName={`record-media-work-${entry.slug}`}
        >
          {#snippet media()}
            {#if entry.cover.kind === "image" || entry.cover.kind === "og"}
              <ResponsiveImage cover={{ ...entry.cover, kind: "image" }} />
            {:else}
              <div
                class="asset-placeholder"
                style:aspect-ratio={entry.cover.aspectRatio}
                data-asset-id={entry.cover.assetId}
                role="img"
                aria-label="制作物画像は未設定です"
              >
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
  header {
    margin-bottom: var(--space-10);
  }
  .result-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }
  .work-collection {
    position: relative;
    isolation: isolate;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .work-collection li.hidden {
    display: none;
  }
  .asset-placeholder {
    display: grid;
    place-content: center;
    gap: var(--space-2);
    border: 1px solid var(--color-line);
    color: var(--color-muted);
    text-align: center;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(var(--space-10), 7vw, var(--space-24))
      clamp(var(--space-6), 5vw, var(--space-16));
  }
  .list {
    border-bottom: 1px solid var(--color-line);
  }
  @media (max-width: 44rem) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
