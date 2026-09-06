<script lang="ts">
  import type { LayoutGap, LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  const gapClasses: Record<LayoutGap, string> = { xs: "gap-2", sm: "gap-4", md: "gap-6", lg: "gap-8", xl: "gap-12" };
  const ratioClasses = {
    equal: "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
    leading: "grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
    trailing: "grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
  } as const;

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
  class={cn("grid max-sm:grid-cols-1", gapClasses[gap], ratioClasses[ratio], className)}
  data-gap={gap}
  data-ratio={ratio}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
