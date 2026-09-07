<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  const gapClasses: Record<LayoutGap, string> = {
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-12",
  };

  let {
    as = "div",
    children,
    class: className = "",
    gap = "md",
    ...restProps
  }: LayoutProps & { gap?: LayoutGap } = $props();
</script>

<svelte:element this={as} class={cn("flex flex-col", gapClasses[gap], className)} data-gap={gap} {...restProps}>
  {@render children?.()}
</svelte:element>
