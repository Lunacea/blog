<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils.ts";

  let {
    children,
    href,
    variant = "outline",
    class: className = "",
  }: {
    children?: Snippet;
    href?: string;
    variant?: "outline" | "solid" | "accent" | "negative";
    class?: string;
  } = $props();

  const classes = $derived(cn(
    "inline-flex min-h-8 items-center gap-1 rounded-sharp border px-2 font-interface text-(length:--text-caption) no-underline [&>svg]:shrink-0 [&>svg]:text-(length:--text-small)",
    variant === "outline" && "border-support text-quiet",
    variant === "solid" && "border-ink bg-ink text-canvas",
    variant === "accent" && "border-signal text-signal",
    variant === "negative" && "border-(--color-negative) text-(--color-negative)",
    href && "hover:border-signal hover:bg-signal hover:text-black focus-visible:border-signal focus-visible:bg-signal focus-visible:text-black",
    className,
  ));
</script>

{#if href}
  <a class={classes} {href}>{@render children?.()}</a>
{:else}
  <span class={classes}>{@render children?.()}</span>
{/if}
