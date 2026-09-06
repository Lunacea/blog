<script lang="ts">
  import type { LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  let {
    as = "div",
    children,
    class: className = "",
    axis = "inline",
    ...restProps
  }: LayoutProps & { axis?: "inline" | "block" | "both" } = $props();
</script>

<svelte:element
  this={as}
  class={cn(
    (axis === "inline" || axis === "both") && "-mx-(--layout-gutter) w-[calc(100%+2*var(--layout-gutter))]",
    (axis === "block" || axis === "both") && "-my-8 py-8",
    className,
  )}
  data-axis={axis}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
