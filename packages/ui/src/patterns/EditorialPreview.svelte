<script lang="ts">
  import EditorialSample, { headings } from "./fixtures/EditorialSample.svx";
  import ReadingSurface from "./ReadingSurface.svelte";
</script>

<header class="shell py-16">
  <p class="m-0 font-code text-(length:--text-caption) text-quiet">Patterns / Editorial reading surface</p>
  <h1 class="my-3 font-editorial text-(length:--text-h2) font-regular leading-tight">SVX rendering contract</h1>
  <span class="m-0 font-code text-(length:--text-caption) text-quiet">TOC, annotation, quote, code, Mermaid, and math</span>
</header>

<ReadingSurface component={EditorialSample} {headings} />
