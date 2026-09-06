<script lang="ts">
  import Icon from "../icons/Icon.svelte";
  import { tagIconName } from "../icons/semantic.ts";
  import Badge from "../primitives/Badge.svelte";
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
  <Badge variant="solid" class={cn("tag-label text-shadow-none", className)} {href}>
    <Icon name={tagIconName(tag)} />
    <span>{tag}</span>
  </Badge>
{:else}
  <Badge variant="solid" class={cn("tag-label text-shadow-none", className)}>
    <Icon name={tagIconName(tag)} />
    <span>{tag}</span>
  </Badge>
{/if}
