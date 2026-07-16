<script lang="ts">
  import { onMount } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import { parseFilterQuery, updateFilterQuery } from "@lunacea/core/filter-query.ts";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";
  let { data } = $props();
  const entries = $derived(data.groups.flatMap((group) =>
    group.entries.map((entry) => ({ ...entry, kind: group.kind }))
  ));
  const kinds = $derived(data.groups.map((group) => group.kind));
  const years = $derived([...new Set(entries.map((entry) => entry.publishedAt.slice(0, 4)))]);
  const tags = $derived([...new Set(entries.flatMap((entry) => entry.tags))].sort());
  let enhanced = $state(false);
  let filters = $state({ kind: "", year: "", tag: "" });

  function readLocation() {
    const parsed = parseFilterQuery(location.search, { kind: kinds, year: years, tag: tags });
    filters = { kind: parsed.kind ?? "", year: parsed.year ?? "", tag: parsed.tag ?? "" };
  }

  function apply(event: SubmitEvent) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)) as Record<string, string>;
    filters = { kind: values.kind ?? "", year: values.year ?? "", tag: values.tag ?? "" };
    history.pushState({}, "", updateFilterQuery(location.search, filters));
  }

  onMount(() => {
    enhanced = true;
    readLocation();
    addEventListener("popstate", readLocation);
    return () => removeEventListener("popstate", readLocation);
  });
</script>

<PageHead
  title={`Archive — ${siteConfig.name}`}
  description="写真、場所、ワイン、瞬間を、時間と場所の手掛かりとともに残す個人アーカイブ。"
  path="/archive"
/>

<div class="page shell">
  <header class="archive-header" data-reveal>
    <p class="eyebrow">Fragments / Personal records</p>
    <h1 class="page-title">Archive</h1>
    <p class="lead">
      日記、写真、場所、ワイン、瞬間を、時間と場所の手掛かりとともに残します。
    </p>
  </header>
  <form method="GET" onsubmit={apply} aria-label="アーカイブを絞り込む">
    <label>種類<select name="kind" bind:value={filters.kind}><option value="">すべて</option>{#each kinds as kind}<option value={kind}>{kind}</option>{/each}</select></label>
    <label>年<select name="year" bind:value={filters.year}><option value="">すべて</option>{#each years as year}<option value={year}>{year}</option>{/each}</select></label>
    <label>タグ<select name="tag" bind:value={filters.tag}><option value="">すべて</option>{#each tags as tag}<option value={tag}>{tag}</option>{/each}</select></label>
    <button type="submit">適用</button>
    {#if filters.kind || filters.year || filters.tag}<a href="/archive">解除</a>{/if}
  </form>
  <div class="preview-grid">
    {#each entries as entry, index}
      {@const visible = !enhanced || ((!filters.kind || entry.kind === filters.kind) && (!filters.year || entry.publishedAt.startsWith(filters.year)) && (!filters.tag || entry.tags.includes(filters.tag)))}
      <a class:hidden={!visible} href={"/archive/" + entry.kind + "/" + entry.slug}>
        {#if entry.cover}
          <figure data-reveal="image" data-ratio={index % 3}>
            <ResponsiveImage cover={entry.cover} />
          </figure>
        {/if}
        <span class="date">{entry.kind} / {entry.publishedAt}</span>
        <h2 style:view-transition-name={`record-${entry.type}-${entry.slug}`}>{entry.title}</h2>
        <p>{entry.summary}</p>
      </a>
    {/each}
  </div>
</div>

<style>
  .archive-header {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    margin-bottom: var(--section-space);
  }

  .archive-header .eyebrow {
    grid-column: 1 / -1;
  }

  .archive-header .lead {
    align-self: end;
  }

  form { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: end; margin-bottom: var(--space-16); border-block: 1px solid var(--color-line); padding-block: var(--space-5); }
  label { display: grid; gap: var(--space-1); color: var(--color-muted); font-size: var(--text-caption); }
  select, button { min-height: var(--control-size); border: 1px solid var(--color-line); border-radius: var(--radius-small); background: var(--color-background); color: var(--color-foreground); padding-inline: var(--space-3); font: inherit; }
  button { background: var(--color-foreground); color: var(--color-background); }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(var(--space-4), 6vw, var(--space-20));
  }

  .preview-grid a {
    display: block;
    align-self: start;
    text-decoration: none;
  }

  .preview-grid a.hidden { display: none; }

  figure {
    overflow: hidden;
    margin: 0;
    aspect-ratio: 4 / 3;
    background: var(--color-surface);
  }

  figure[data-ratio="1"] {
    aspect-ratio: 3 / 4;
  }

  figure[data-ratio="2"] {
    aspect-ratio: 16 / 10;
  }

  .date {
    display: block;
    margin-top: var(--space-4);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  h2 {
    margin: var(--space-1) 0;
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
  }

  p {
    max-width: 34rem;
    margin: 0;
    color: var(--color-muted);
  }

  @media (max-width: 52rem) {
    .archive-header, .preview-grid {
      grid-template-columns: 1fr;
    }

    .archive-header .lead {
      margin-top: var(--space-8);
    }

    figure,
    figure[data-ratio="1"],
    figure[data-ratio="2"] {
      aspect-ratio: 4 / 3;
    }
  }
</style>
