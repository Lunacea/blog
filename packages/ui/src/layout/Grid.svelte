<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";

  let {
    as = "div",
    children,
    class: className = "",
    gap = "md",
    min = "standard",
    ...restProps
  }: LayoutProps & {
    gap?: LayoutGap;
    min?: "compact" | "standard" | "wide";
  } = $props();
</script>

<svelte:element
  this={as}
  class={`layout-grid ${className}`}
  data-gap={gap}
  data-min={min}
  {...restProps}
>
  {@render children?.()}
</svelte:element>

<style>
  .layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--layout-grid-min)), 1fr));
    gap: var(--layout-gap, var(--space-6));
  }

  [data-gap="xs"] { --layout-gap: var(--space-2); }
  [data-gap="sm"] { --layout-gap: var(--space-4); }
  [data-gap="md"] { --layout-gap: var(--space-6); }
  [data-gap="lg"] { --layout-gap: var(--space-8); }
  [data-gap="xl"] { --layout-gap: var(--space-12); }
  [data-min="compact"] { --layout-grid-min: var(--layout-grid-compact); }
  [data-min="standard"] { --layout-grid-min: var(--layout-grid-standard); }
  [data-min="wide"] { --layout-grid-min: var(--layout-grid-wide); }
</style>
