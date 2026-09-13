<script lang="ts">
  import { cn } from "../utils.ts";

  /** カテゴリはサイトの区画なのでノンブルとして組む。タグは `#tag` の形を保つ。 */
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
  <a
    class={cn(base, "group/category inline-flex min-h-control items-center text-ink no-underline pressable [--press-scale:0.97] hover:no-underline", className)}
    {href}
  >
    <span
      class="border-b border-rule pb-[.3em] transition-colors duration-(--motion-duration-fast) ease-standard group-hover/category:border-ink group-focus-visible/category:border-ink group-active/category:border-ink"
    >{category}</span>
  </a>
{:else}
  <span class={cn(base, "text-quiet", className)}>{category}</span>
{/if}
