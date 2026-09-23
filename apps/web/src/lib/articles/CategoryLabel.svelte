<script lang="ts">
  import { cn } from "@lunacea/ui/utils";

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
    class={cn(base, "inline-flex min-h-control items-center text-ink no-underline pressable [--press-scale:0.97] hover:no-underline", className)}
    {href}
  >
    <!-- 罫は常に引いてあり、ホバーで同じ位置をインクが左から塗る。drop は pb と対で決まる。 -->
    <span class="ink-underline border-b border-rule pb-[.3em] [--ink-underline-drop:calc(.65em_+_var(--border-width-rule))]">{category}</span>
  </a>
{:else}
  <span class={cn(base, "text-quiet", className)}>{category}</span>
{/if}
