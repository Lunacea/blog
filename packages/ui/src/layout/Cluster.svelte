<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  const gapClasses: Record<LayoutGap, string> = { xs: "gap-2", sm: "gap-4", md: "gap-6", lg: "gap-8", xl: "gap-12" };
  const alignClasses = { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline" } as const;
  const justifyClasses = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const;

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
  class={cn("flex flex-wrap", gapClasses[gap], alignClasses[align], justifyClasses[justify], className)}
  data-gap={gap}
  data-align={align}
  data-justify={justify}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
