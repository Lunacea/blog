<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils.ts";

  let {
    children,
    variant = "outline",
    class: className = "",
  }: {
    children?: Snippet;
    variant?: "outline" | "accent" | "negative";
    class?: string;
  } = $props();

  const classes = $derived(cn(
    "inline-flex items-center gap-1 rounded-sharp border px-(--space-2) py-[.32em] font-interface text-(length:--text-caption) leading-none [&>svg]:shrink-0 [&>svg]:text-(length:--text-small)",
    variant === "outline" && "border-support text-quiet",
    variant === "accent" && "border-signal text-signal",
    variant === "negative" && "border-(--color-negative) text-(--color-negative)",
    className,
  ));
</script>

<span class={classes}>{@render children?.()}</span>
