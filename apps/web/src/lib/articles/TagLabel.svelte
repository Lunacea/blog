<script lang="ts">
  import { cn } from "@lunacea/ui/utils";
  import { Icon, interfaceIcons, tagIconName } from "@lunacea/ui/icons";

  let {
    tag,
    href,
    class: className = "",
  }: {
    tag: string;
    href?: string;
    class?: string;
  } = $props();

  // 汎用グリフは固有マークがないことを意味するので何も表示しない。
  const icon = $derived(tagIconName(tag));
  const branded = $derived(icon !== interfaceIcons.tag);
</script>

{#if href}
  <a class={cn("tag-label ink-underline inline-flex min-h-8 items-center gap-x-(--space-1) text-caption text-quiet no-underline pressable [--press-scale:0.96] hover:text-ink hover:no-underline focus-visible:text-ink active:text-ink", className)} {href}>{#if branded}<Icon name={icon} class="size-[1em] shrink-0" />{/if}#{tag}</a>
{:else}
  <span class={cn("tag-label inline-flex items-center gap-x-(--space-1) text-caption text-quiet", className)}>{#if branded}<Icon name={icon} class="size-[1em] shrink-0" />{/if}#{tag}</span>
{/if}
