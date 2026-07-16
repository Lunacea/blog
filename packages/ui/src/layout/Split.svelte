<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";

  let {
    as = "div",
    children,
    class: className = "",
    gap = "lg",
    ratio = "equal",
    ...restProps
  }: LayoutProps & {
    gap?: LayoutGap;
    ratio?: "equal" | "leading" | "trailing";
  } = $props();
</script>

<svelte:element
  this={as}
  class={`layout-split ${className}`}
  data-gap={gap}
  data-ratio={ratio}
  {...restProps}
>
  {@render children?.()}
</svelte:element>

<style>
  .layout-split {
    display: grid;
    grid-template-columns: var(--layout-split, minmax(0, 1fr) minmax(0, 1fr));
    gap: var(--layout-gap, var(--space-8));
  }

  [data-gap="xs"] { --layout-gap: var(--space-2); }
  [data-gap="sm"] { --layout-gap: var(--space-4); }
  [data-gap="md"] { --layout-gap: var(--space-6); }
  [data-gap="lg"] { --layout-gap: var(--space-8); }
  [data-gap="xl"] { --layout-gap: var(--space-12); }
  [data-ratio="leading"] { --layout-split: minmax(0, 2fr) minmax(0, 1fr); }
  [data-ratio="trailing"] { --layout-split: minmax(0, 1fr) minmax(0, 2fr); }

  @media (max-width: 44rem) {
    .layout-split {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
