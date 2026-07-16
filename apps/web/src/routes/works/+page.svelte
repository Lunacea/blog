<script lang="ts">
  import { onMount } from "svelte";
  import { siteConfig } from "@lunacea/config";
  import { parseFilterQuery, updateFilterQuery } from "@lunacea/core/filter-query.ts";
  import { StatusBadge } from "$ui/components";
  import PageHead from "$lib/components/PageHead.svelte";
  import ResponsiveImage from "$lib/components/ResponsiveImage.svelte";
  let { data } = $props();
  const statuses = ["stable", "growing", "fragment", "deprecated"];
  let enhanced = $state(false);
  let filters = $state({ status: "", year: "", stack: "" });
  function readLocation() {
    const parsed = parseFilterQuery(location.search, { status: statuses, year: data.years, stack: data.stacks });
    filters = { status: parsed.status ?? "", year: parsed.year ?? "", stack: parsed.stack ?? "" };
  }
  function apply(event: SubmitEvent) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)) as Record<string, string>;
    filters = { status: values.status ?? "", year: values.year ?? "", stack: values.stack ?? "" };
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
  title={`Works — ${siteConfig.name}`}
  description="実装、研究、空間表現を、役割と技術、検証した問いとともに記録します。"
  path="/works"
/>

<div class="page shell">
  <header data-reveal>
    <p class="eyebrow">Catalog / Constructed</p>
    <h1 class="page-title">Works</h1>
    <p class="lead">作ったものだけでなく、問題、役割、設計判断、検証と反省をケーススタディとして示します。</p>
  </header>
  <form method="GET" onsubmit={apply} aria-label="制作物を絞り込む">
    <label>状態<select name="status" bind:value={filters.status}><option value="">すべて</option>{#each statuses as status}<option value={status}>{status}</option>{/each}</select></label>
    <label>年<select name="year" bind:value={filters.year}><option value="">すべて</option>{#each data.years as year}<option value={year}>{year}</option>{/each}</select></label>
    <label>技術<select name="stack" bind:value={filters.stack}><option value="">すべて</option>{#each data.stacks as stack}<option value={stack}>{stack}</option>{/each}</select></label>
    <button type="submit">適用</button>
    {#if filters.status || filters.year || filters.stack}<a href="/works">解除</a>{/if}
  </form>
  <ol class="work-grid">
    {#each data.entries as entry}
      {@const visible = !enhanced || ((!filters.status || entry.status === filters.status) && (!filters.year || entry.publishedAt.startsWith(filters.year)) && (!filters.stack || entry.stack.includes(filters.stack)))}
      <li class:hidden={!visible}>
        <a href={"/works/" + entry.slug}>
          {#if entry.cover.kind === "image" || entry.cover.kind === "og"}
            <ResponsiveImage cover={{ ...entry.cover, kind: "image" }} />
          {:else}
            <div class="asset-placeholder" style:aspect-ratio={entry.cover.aspectRatio} data-asset-id={entry.cover.assetId} role="img" aria-label="制作物画像は未設定です">
              <span>Asset placeholder</span><code>{entry.cover.assetId}</code>
            </div>
          {/if}
          <div class="work-copy">
            <div class="meta"><time datetime={entry.publishedAt}>{entry.period}</time><StatusBadge status={entry.status} /></div>
            <h2>{entry.title}</h2>
            <p>{entry.summary}</p>
            <p class="role">{entry.role}</p>
            <ul aria-label="使用技術">{#each entry.stack as item}<li>{item}</li>{/each}</ul>
          </div>
        </a>
      </li>
    {/each}
  </ol>
</div>

<style>
  header { margin-bottom: var(--space-12); }
  form { display: flex; flex-wrap: wrap; align-items: end; gap: var(--space-4); margin-bottom: var(--space-16); border-block: 1px solid var(--color-line); padding-block: var(--space-5); }
  label { display: grid; gap: var(--space-1); color: var(--color-muted); font-size: var(--text-caption); }
  select, button { min-height: var(--control-size); border: 1px solid var(--color-line); border-radius: var(--radius-small); background: var(--color-background); color: var(--color-foreground); padding-inline: var(--space-3); font: inherit; }
  button { background: var(--color-foreground); color: var(--color-background); }
  .work-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(var(--space-8), 6vw, var(--space-16)); margin: 0; padding: 0; list-style: none; }
  .work-grid li.hidden { display: none; }
  .work-grid a { display: block; text-decoration: none; }
  .work-grid :global(picture), .asset-placeholder { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
  .asset-placeholder { display: grid; place-content: center; gap: var(--space-2); border: 1px solid var(--color-line); background: var(--color-surface); color: var(--color-muted); text-align: center; }
  .work-copy { padding-top: var(--space-4); }
  .meta { display: flex; justify-content: space-between; color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-caption); }
  h2 { margin: var(--space-3) 0; font-size: var(--text-h2); }
  p { color: var(--color-muted); }
  .role { color: var(--color-foreground); }
  ul { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-4) 0 0; padding: 0; list-style: none; color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-caption); }
  @media (max-width: 44rem) { .work-grid { grid-template-columns: 1fr; } }
</style>
