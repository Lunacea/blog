<script lang="ts">
  import type { LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  let {
    as = "div",
    children,
    class: className = "",
    width = "content",
    ...restProps
  }: LayoutProps & { width?: "content" | "prose" | "full" } = $props();
</script>

<svelte:element
  this={as}
  class={cn(
    "mx-auto w-[min(calc(100%-2*var(--layout-gutter)),var(--content-width))]",
    width === "prose" && "max-w-prose",
    width === "full" && "w-full max-w-none",
    className,
  )}
  data-width={width}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
