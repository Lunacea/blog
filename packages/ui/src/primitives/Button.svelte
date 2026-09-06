<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { actionVariants, type ActionVariant } from "./variants.ts";

  let {
    children,
    variant = "default",
    class: className = "",
    ...restProps
  }: Omit<HTMLButtonAttributes, "class"> & {
    children?: Snippet;
    variant?: ActionVariant;
    class?: string;
  } = $props();
</script>

<button class={actionVariants(variant, className)} data-variant={variant} {...restProps}>
  {@render children?.()}
</button>
