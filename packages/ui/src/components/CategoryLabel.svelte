<script lang="ts">
  import { cn } from "../utils.ts";

  /**
   * A category is a section of the site, so it is set as a folio marker: condensed, tracked
   * and uppercase. Tags are a different thing entirely and keep the `#tag` form.
   */
  let {
    category,
    href,
    class: className = "",
  }: {
    category: string;
    href?: string;
    class?: string;
  } = $props();

  const base = "category-label font-stretch-72% text-folio leading-none tracking-folio uppercase";
</script>

{#if href}
  <a class={cn(base, "inline-flex min-h-control items-center text-ink no-underline underline-offset-[.5em] pressable [--press-scale:0.97] hover:underline active:underline", className)} {href}>{category}</a>
{:else}
  <span class={cn(base, "text-quiet", className)}>{category}</span>
{/if}
