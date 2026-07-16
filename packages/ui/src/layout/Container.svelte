<script lang="ts">
  import type { LayoutProps } from "./types.ts";

  let {
    as = "div",
    children,
    class: className = "",
    width = "content",
    ...restProps
  }: LayoutProps & { width?: "content" | "prose" | "full" } = $props();
</script>

<svelte:element this={as} class={`layout-container ${className}`} data-width={width} {...restProps}>
  {@render children?.()}
</svelte:element>

<style>
  .layout-container {
    width: min(calc(100% - (2 * var(--layout-gutter))), var(--content-width));
    margin-inline: auto;
  }

  .layout-container[data-width="prose"] {
    max-width: var(--prose-width);
  }

  .layout-container[data-width="full"] {
    width: 100%;
    max-width: none;
  }
</style>
