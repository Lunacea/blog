<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import { ContentList } from "$ui/patterns";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
  const categories = ["engineering", "research", "design", "essay", "log", "talk"];
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

  <form method="GET" aria-label="記事を絞り込む" data-reveal>
    <label class="query">
      <span>検索語</span>
      <input type="search" name="q" value={data.query} maxlength="120" />
    </label>
    <label>
      <span>カテゴリ</span>
      <select name="category">
        <option value="">すべて</option>
        {#each categories as category}
          <option value={category} selected={data.filters.category === category}>{category}</option>
        {/each}
      </select>
    </label>
    {#if siteConfig.featuredArticleTags.length}
      <label>
        <span>代表タグ</span>
        <select name="tag">
          <option value="">すべて</option>
          {#each siteConfig.featuredArticleTags as tag}
            <option value={tag} selected={data.filters.tag === tag}>{tag}</option>
          {/each}
        </select>
      </label>
    {/if}
    <label>
      <span>並び順</span>
      <select name="sort">
        <option value="relevance" selected={data.sort === "relevance"}>関連度</option>
        <option value="published" selected={data.sort === "published"}>公開日</option>
        <option value="updated" selected={data.sort === "updated"}>更新日</option>
      </select>
    </label>
    <div class="actions">
      <button type="submit">検索</button>
      {#if data.isFiltered}<a href="/articles">解除</a>{/if}
    </div>
  </form>

  <div class="result-heading" aria-live="polite">
    <p>{data.entries.length} records</p>
    {#if data.query}<p>“{data.query}” の検索結果</p>{/if}
  </div>
  {#if data.entries.length}
    <ContentList entries={data.entries} />
  {:else}
    <p class="empty">条件に一致する記事はありません。条件を解除してもう一度お試しください。</p>
  {/if}
</div>

<style>
  header { margin-bottom: var(--space-12); }
  form {
    display: grid;
    grid-template-columns: minmax(12rem, 2fr) repeat(2, minmax(9rem, 1fr)) auto;
    gap: var(--space-4);
    align-items: end;
    margin-bottom: var(--space-12);
    border-block: 1px solid var(--color-line);
    padding-block: var(--space-6);
  }
  label { display: grid; min-width: 0; gap: var(--space-1); color: var(--color-muted); font-size: var(--text-caption); }
  input, select, button {
    min-height: var(--control-size);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-small);
    background: var(--color-background);
    color: var(--color-foreground);
    font: inherit;
  }
  input, select { width: 100%; min-width: 0; padding-inline: var(--space-3); }
  button { padding-inline: var(--space-5); background: var(--color-foreground); color: var(--color-background); }
  .actions { display: flex; min-width: 0; align-items: center; gap: var(--space-3); }
  .result-heading { display: flex; justify-content: space-between; color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-caption); }
  .empty { border-block: 1px solid var(--color-line); padding-block: var(--space-10); color: var(--color-muted); }
  @media (max-width: 52rem) { form { grid-template-columns: repeat(2, minmax(0, 1fr)); } .query { grid-column: 1 / -1; } }
  @media (max-width: 34rem) { form { grid-template-columns: minmax(0, 1fr); } .query { grid-column: auto; } }
</style>
