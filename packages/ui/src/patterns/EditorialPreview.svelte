<script lang="ts">
  import EditorialSample, { headings } from "./fixtures/EditorialSample.svx";
  import ReadingSurface from "./ReadingSurface.svelte";
</script>

<header class="editorial-header shell">
  <p>Patterns / Editorial reading surface</p>
  <h1>SVX rendering contract</h1>
  <span>TOC, annotation, quote, code, Mermaid, and math</span>
</header>

<ReadingSurface component={EditorialSample} {headings} />

<style>
  .editorial-header {
    padding-block: var(--space-16);
  }

  p,
  h1,
  span {
    margin: 0;
  }

  p,
  span {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  h1 {
    margin-block: var(--space-3);
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    font-weight: var(--weight-regular);
    line-height: var(--leading-tight);
  }
</style>
