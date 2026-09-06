<script lang="ts">
  import type { ArticlePreviewVariant } from "./article-preview-variant.ts";
  import ArticlePreview from "./ArticlePreview.svelte";

  let { variant = "column", image = true }: {
    variant?: ArticlePreviewVariant;
    image?: boolean;
  } = $props();
</script>

<div class="max-w-184">
    <ArticlePreview
      href="#article"
      title="壊れにくいコンテンツパイプラインを設計する"
      summary="日本語とEnglish textが混在する長めの概要でも、情報の順序を保ちます。"
      category="engineering"
      publishedAt="2026-04-18"
      tags={["SvelteKit", "Deno", "Accessibility"]}
      composition={{ estimatedMinutes: 5, textCharacters: 4801, paperLayers: 5, blocks: [], sections: [] }}
      {variant}
      hasMedia={image}
    >
      {#snippet media()}<div class="grid aspect-16/10 w-full place-items-center bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-surface))] text-quiet" data-preview-media>Article cover</div>{/snippet}
    </ArticlePreview>
</div>
