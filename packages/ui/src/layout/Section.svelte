<script lang="ts">
  import type { LayoutProps } from "./types.ts";
  import { cn } from "../utils.ts";

  let {
    as = "section",
    children,
    class: className = "",
    space = "default",
    ...restProps
  }: LayoutProps & { space?: "compact" | "default" | "spacious" } = $props();
</script>

<svelte:element
  this={as}
  class={cn(
    "py-section",
    space === "compact" && "py-16",
    space === "spacious" && "py-40",
    className,
  )}
  data-space={space}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
