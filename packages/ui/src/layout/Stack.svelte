<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";

  let {
    as = "div",
    children,
    class: className = "",
    gap = "md",
    ...restProps
  }: LayoutProps & { gap?: LayoutGap } = $props();
</script>

<svelte:element this={as} class={`layout-stack ${className}`} data-gap={gap} {...restProps}>
  {@render children?.()}
</svelte:element>

<style>
  .layout-stack {
    display: flex;
    flex-direction: column;
    gap: var(--layout-gap, var(--space-6));
  }

  [data-gap="xs"] { --layout-gap: var(--space-2); }
  [data-gap="sm"] { --layout-gap: var(--space-4); }
  [data-gap="md"] { --layout-gap: var(--space-6); }
  [data-gap="lg"] { --layout-gap: var(--space-8); }
  [data-gap="xl"] { --layout-gap: var(--space-12); }
</style>
