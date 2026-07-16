<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";

  let {
    as = "div",
    children,
    class: className = "",
    gap = "md",
    align = "center",
    justify = "start",
    ...restProps
  }: LayoutProps & {
    gap?: LayoutGap;
    align?: "start" | "center" | "end" | "baseline";
    justify?: "start" | "center" | "end" | "between";
  } = $props();
</script>

<svelte:element
  this={as}
  class={`layout-cluster ${className}`}
  data-gap={gap}
  data-align={align}
  data-justify={justify}
  {...restProps}
>
  {@render children?.()}
</svelte:element>

<style>
  .layout-cluster {
    display: flex;
    flex-wrap: wrap;
    align-items: var(--layout-align, center);
    justify-content: var(--layout-justify, flex-start);
    gap: var(--layout-gap, var(--space-6));
  }

  [data-gap="xs"] { --layout-gap: var(--space-2); }
  [data-gap="sm"] { --layout-gap: var(--space-4); }
  [data-gap="md"] { --layout-gap: var(--space-6); }
  [data-gap="lg"] { --layout-gap: var(--space-8); }
  [data-gap="xl"] { --layout-gap: var(--space-12); }
  [data-align="start"] { --layout-align: flex-start; }
  [data-align="center"] { --layout-align: center; }
  [data-align="end"] { --layout-align: flex-end; }
  [data-align="baseline"] { --layout-align: baseline; }
  [data-justify="start"] { --layout-justify: flex-start; }
  [data-justify="center"] { --layout-justify: center; }
  [data-justify="end"] { --layout-justify: flex-end; }
  [data-justify="between"] { --layout-justify: space-between; }
</style>
