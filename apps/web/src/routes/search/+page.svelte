<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import ContentList from "$ui/ContentList.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
  const types = ["article", "work", "talk", "photo", "place", "wine", "moment"];
  const statuses = ["stable", "growing", "fragment", "deprecated"];
</script>

<PageHead
  title={`Search — ${siteConfig.name}`}
  description="タイトル、概要、本文、タグから、すべての資料種別を横断して検索します。"
  path="/search"
/>

<div class="page shell">
  <header data-reveal>
    <p class="eyebrow">Index / Full text</p>
    <h1 class="page-title">Search</h1>
    <p class="lead">タイトル、概要、本文、タグから、すべての資料種別を横断して探します。</p>
  </header>
  <form method="GET" data-reveal>
    <label class="query">
      <span>検索語</span>
      <input type="search" name="q" value={data.query} maxlength="120" />
    </label>
    <div class="filters">
      <label>種類
        <select name="type">
          <option value="">すべて</option>
          {#each types as type}
            <option value={type} selected={data.filters.type === type}>{type}</option>
          {/each}
        </select>
      </label>
      <label>タグ
        <select name="tag">
          <option value="">すべて</option>
          {#each data.tags as tag}
            <option value={tag} selected={data.filters.tag === tag}>{tag}</option>
          {/each}
        </select>
      </label>
      <label>年
        <select name="year">
          <option value="">すべて</option>
          {#each data.years as year}
            <option value={year} selected={data.filters.year === year}>{year}</option>
          {/each}
        </select>
      </label>
      <label>状態
        <select name="status">
          <option value="">すべて</option>
          {#each statuses as status}
            <option value={status} selected={data.filters.status === status}>{status}</option>
          {/each}
        </select>
      </label>
      <button type="submit">検索</button>
    </div>
  </form>
  <div class="result-heading">
    <p>{data.results.length} records</p>
    {#if data.query}<p>“{data.query}” の検索結果</p>{/if}
  </div>
  <ContentList entries={data.results} showType />
</div>

<style>
  header {
    margin-bottom: var(--space-12);
  }

  form {
    margin-bottom: var(--space-16);
    border-block: 1px solid var(--color-line);
    padding-block: var(--space-6);
  }

  label {
    display: grid;
    gap: var(--space-1);
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  .query input {
    min-height: var(--space-16);
    border: 0;
    border-bottom: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding: 0;
    background: transparent;
    font-family: var(--font-serif);
    font-size: var(--text-h2);
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(4, 1fr) auto;
    gap: var(--space-4);
    margin-top: var(--space-4);
  }

  select,
  button {
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-3);
    background: var(--color-surface);
  }

  button {
    align-self: end;
    padding-inline: var(--space-5);
    border-color: var(--color-primary);
    color: var(--color-background);
    background: var(--color-primary);
    cursor: pointer;
  }

  .result-heading {
    display: flex;
    justify-content: space-between;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  @media (max-width: 48rem) {
    .filters {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
