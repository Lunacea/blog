<script lang="ts">
  import type { Content } from "@lunacea/schemas";
  import { ContentList } from "$ui/patterns";

  let {
    eyebrow,
    title,
    description,
    entries,
    showType = false
  }: {
    eyebrow: string;
    title: string;
    description: string;
    entries: Content[];
    showType?: boolean;
  } = $props();
</script>

<div class="page shell content-shell">
  <header class="index-header" data-reveal>
    <p class="eyebrow">{eyebrow}</p>
    <h1 class="page-title">{title}</h1>
    <p class="lead">{description}</p>
  </header>
  {#if entries.length}
    <ContentList {entries} {showType} />
  {:else}
    <p class="empty">該当する資料はまだありません。</p>
  {/if}
</div>

<style>
  .index-header {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) 1fr;
    margin-bottom: clamp(var(--space-12), 8vw, var(--space-28));
  }

  .index-header .eyebrow {
    grid-column: 1 / -1;
  }

  .lead {
    align-self: end;
  }

  .empty {
    border-top: 1px solid var(--color-line);
    padding-block: var(--space-12);
    color: var(--color-muted);
  }

  @media (max-width: 44rem) {
    .index-header {
      grid-template-columns: 1fr;
    }
  }
</style>
