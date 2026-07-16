<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import { ContentList } from "$ui/patterns";
  import { Button, Input, NativeSelect } from "$ui/primitives";
  import { Icon, interfaceIcons } from "$ui/icons";
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
      <Input variant="query" type="search" name="q" value={data.query} maxlength={120} />
    </label>
    <div class="filters">
      <label>種類
        <NativeSelect name="type">
          <option value="">すべて</option>
          {#each types as type}
            <option value={type} selected={data.filters.type === type}>{type}</option>
          {/each}
        </NativeSelect>
      </label>
      <label>タグ
        <NativeSelect name="tag">
          <option value="">すべて</option>
          {#each data.tags as tag}
            <option value={tag} selected={data.filters.tag === tag}>{tag}</option>
          {/each}
        </NativeSelect>
      </label>
      <label>年
        <NativeSelect name="year">
          <option value="">すべて</option>
          {#each data.years as year}
            <option value={year} selected={data.filters.year === year}>{year}</option>
          {/each}
        </NativeSelect>
      </label>
      <label>状態
        <NativeSelect name="status">
          <option value="">すべて</option>
          {#each statuses as status}
            <option value={status} selected={data.filters.status === status}>{status}</option>
          {/each}
        </NativeSelect>
      </label>
      <Button variant="primary" type="submit">
        <Icon name={interfaceIcons.search} dataIcon="inline-start" />検索
      </Button>
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

  .filters {
    display: grid;
    grid-template-columns: repeat(4, 1fr) auto;
    gap: var(--space-4);
    margin-top: var(--space-4);
  }

  :global(.filters .button) {
    align-self: end;
    padding-inline: var(--space-5);
  }

  .result-heading {
    display: flex;
    justify-content: space-between;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  @media (max-width: 44rem) {
    .filters {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
