<script lang="ts">
  import type { LayoutProps } from "./types.ts";

  let {
    as = "div",
    children,
    class: className = "",
    axis = "inline",
    ...restProps
  }: LayoutProps & { axis?: "inline" | "block" | "both" } = $props();
</script>

<svelte:element this={as} class={`layout-bleed ${className}`} data-axis={axis} {...restProps}>
  {@render children?.()}
</svelte:element>

<style>
  .layout-bleed[data-axis="inline"],
  .layout-bleed[data-axis="both"] {
    width: calc(100% + (2 * var(--layout-gutter)));
    margin-inline: calc(-1 * var(--layout-gutter));
  }

  .layout-bleed[data-axis="block"],
  .layout-bleed[data-axis="both"] {
    margin-block: calc(-1 * var(--space-8));
    padding-block: var(--space-8);
  }
</style>
