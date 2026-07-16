<script lang="ts">
  import type { LayoutProps } from "./types.ts";

  let {
    as = "section",
    children,
    class: className = "",
    space = "default",
    ...restProps
  }: LayoutProps & { space?: "compact" | "default" | "spacious" } = $props();
</script>

<svelte:element this={as} class={`layout-section ${className}`} data-space={space} {...restProps}>
  {@render children?.()}
</svelte:element>

<style>
  .layout-section {
    padding-block: var(--section-space);
  }

  .layout-section[data-space="compact"] {
    padding-block: var(--space-16);
  }

  .layout-section[data-space="spacious"] {
    padding-block: var(--space-40);
  }
</style>
