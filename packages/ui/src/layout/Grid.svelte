<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  const gapClasses: Record<LayoutGap, string> = { xs: "gap-2", sm: "gap-4", md: "gap-6", lg: "gap-8", xl: "gap-12" };
  const minClasses = {
    compact: "grid-cols-[repeat(auto-fit,minmax(min(100%,var(--layout-grid-compact)),1fr))]",
    standard: "grid-cols-[repeat(auto-fit,minmax(min(100%,var(--layout-grid-standard)),1fr))]",
    wide: "grid-cols-[repeat(auto-fit,minmax(min(100%,var(--layout-grid-wide)),1fr))]",
  } as const;

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
  class={cn("grid", gapClasses[gap], minClasses[min], className)}
  data-gap={gap}
  data-min={min}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
