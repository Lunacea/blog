<script lang="ts">
  import ArticlePreview from "./ArticlePreview.svelte";
  import WorkPreview from "./WorkPreview.svelte";

  let { kind = "article", view = "grid", image = true }: {
    kind?: "article" | "work";
    view?: "grid" | "list";
    image?: boolean;
  } = $props();
</script>

<div class="fixture">
  {#if kind === "article"}
    <ArticlePreview
      href="#article"
      title="壊れにくいコンテンツパイプラインを設計する"
      summary="日本語とEnglish textが混在する長めの概要でも、情報の順序を保ちます。"
      category="engineering"
      publishedAt="2026-04-18"
      tags={["SvelteKit", "Deno", "Accessibility"]}
      {view}
      hasMedia={image}
    >
      {#snippet media()}<div class="media" data-preview-media>Article cover</div>{/snippet}
    </ArticlePreview>
  {:else}
    <WorkPreview
      href="#work"
      title="Spatial Interface Lab"
      summary="空間と情報の関係を検証するインタラクティブなケーススタディ。"
      role="Design engineering / research"
      period="2024–2026"
      status="growing"
      technologies={["Svelte", "TypeScript", "WebGL"]}
      {view}
    >
      {#snippet media()}<div class:placeholder={!image} class="media" data-preview-media>{image ? "Work image" : "Asset placeholder"}</div>{/snippet}
    </WorkPreview>
  {/if}
</div>

<style>
  .fixture { max-width: 46rem; }
  .media { display: grid; width: 100%; aspect-ratio: 16 / 10; place-items: center; background: color-mix(in srgb, var(--color-secondary) 24%, var(--color-surface)); color: var(--color-muted); }
  .placeholder { border: 1px solid var(--color-line); background: var(--color-surface); }
</style>
