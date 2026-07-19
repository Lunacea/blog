<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import { TagLabel } from "$ui/components";
  import { ContentList } from "$ui/patterns";
  import PageHead from "$lib/components/PageHead.svelte";

  let { data } = $props();
</script>

<PageHead
  title={`${data.tag} — Tags — ${siteConfig.name}`}
  description={`「${data.tag}」に関連する資料を、種別を越えて表示します。`}
  path={`/tags/${encodeURIComponent(data.tag)}`}
/>

<div class="page shell content-shell catalog-page tag-catalog">
  <header data-reveal>
    <h1 class="page-title">Tags</h1>
  </header>
  <div class="tag-filter" aria-label="適用中のタグ">
    <TagLabel tag={data.tag} />
    <span>{data.entries.length} records</span>
  </div>
  {#if data.entries.length}
    <ContentList entries={data.entries} showType />
  {:else}
    <p class="empty">このタグに一致する資料はありません。</p>
  {/if}
</div>

<style>
  header {
    margin-bottom: var(--space-10);
  }

  .tag-filter {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-8);
    background: var(--color-background);
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  .empty {
    border-top: 1px solid var(--color-line);
    padding-block: var(--space-10);
    background: var(--color-background);
    color: var(--color-muted);
  }
</style>
