<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  let {
    children,
    class: className = "",
    ...restProps
  }: HTMLSelectAttributes & { children?: Snippet } = $props();
</script>

<select class={`native-select ${className}`} {...restProps}>
  {@render children?.()}
</select>

<style>
  .native-select {
    min-height: var(--control-size);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-3);
    background: var(--color-surface);
  }
</style>
