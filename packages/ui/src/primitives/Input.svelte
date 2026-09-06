<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../utils.ts";

  type Props = Omit<HTMLInputAttributes, "value" | "class"> & {
    value?: string;
    variant?: "default" | "query";
    class?: string;
    ref?: HTMLInputElement | null;
  };

  let {
    value = $bindable(""),
    variant = "default",
    class: className = "",
    ref = $bindable(null),
    ...restProps
  }: Props = $props();
</script>

<input
  bind:this={ref}
  bind:value
  class={cn(
    "min-h-control w-full min-w-0 rounded-sharp border border-rule bg-canvas px-3 text-ink",
    variant === "query" &&
      "min-h-16 border-0 border-b border-rule bg-transparent p-0 font-editorial text-(length:--text-h2)",
    className,
  )}
  data-variant={variant}
  {...restProps}
/>
