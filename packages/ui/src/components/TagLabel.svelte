<script lang="ts">
  import { cn } from "../utils.ts";

  let {
    tag,
    href,
    class: className = "",
  }: {
    tag: string;
    href?: string;
    class?: string;
  } = $props();
</script>

{#if href}
  <a class={cn("tag-label inline-flex min-h-8 items-center text-caption text-quiet underline decoration-transparent underline-offset-4 pressable [--press-scale:0.96] hover:text-ink hover:decoration-current focus-visible:decoration-current active:text-ink active:decoration-current", className)} {href}>#{tag}</a>
{:else}
  <span class={cn("tag-label text-caption text-quiet", className)}>#{tag}</span>
{/if}
