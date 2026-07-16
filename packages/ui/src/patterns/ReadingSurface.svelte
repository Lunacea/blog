<script lang="ts">
  import type { Component } from "svelte";
  import ReadingEnhancements from "./ReadingEnhancements.svelte";

  let {
    component,
    class: className = "",
  }: {
    component: Component;
    class?: string;
  } = $props();
  let ContentComponent = $derived(component);
  let prose = $state<HTMLElement | null>(null);
</script>

<div class={["reading-surface", className]}>
  <div class="shell article-grid">
    <div class="prose" bind:this={prose}><ContentComponent /></div>
    <ReadingEnhancements root={prose} />
  </div>
</div>

<style>
  .reading-surface {
    border-block: 1px solid var(--color-line);
    padding-block: var(--section-space);
    background: var(--color-surface);
  }

  .article-grid {
    display: grid;
    grid-template-columns:
      minmax(0, var(--prose-width))
      minmax(var(--layout-grid-compact), 1fr);
    justify-content: space-between;
    gap: clamp(var(--space-8), 8vw, var(--space-32));
  }

  @media (max-width: 60rem) {
    .article-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
