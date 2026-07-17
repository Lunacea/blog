<script lang="ts">
  import Icon from "../icons/Icon.svelte";
  import { tagIconName } from "../icons/semantic.ts";

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
  <a class={`tag-label ${className}`} {href}>
    <Icon name={tagIconName(tag)} />
    <span>{tag}</span>
  </a>
{:else}
  <span class={`tag-label ${className}`}>
    <Icon name={tagIconName(tag)} />
    <span>{tag}</span>
  </span>
{/if}

<style>
  .tag-label {
    display: inline-flex;
    min-height: var(--space-8);
    align-items: center;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-line);
    padding-inline: var(--space-2);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--text-caption);
    text-decoration: none;
  }

  .tag-label :global(svg) {
    flex: none;
    font-size: var(--text-small);
  }

  a.tag-label:hover,
  a.tag-label:focus-visible {
    border-color: var(--color-accent);
    color: var(--color-foreground);
  }
</style>
