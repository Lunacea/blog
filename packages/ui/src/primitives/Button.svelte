<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let {
    children,
    variant = "default",
    class: className = "",
    ...restProps
  }: HTMLButtonAttributes & {
    children?: Snippet;
    variant?: "default" | "primary" | "ghost";
  } = $props();
</script>

<button class={`button ${className}`} data-variant={variant} {...restProps}>
  {@render children?.()}
</button>

<style>
  .button {
    display: inline-flex;
    min-height: var(--control-size);
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-3);
    background: var(--color-surface);
    cursor: pointer;
  }

  .button[data-variant="primary"] {
    border-color: var(--color-primary);
    color: var(--color-background);
    background: var(--color-primary);
  }

  .button[data-variant="ghost"] {
    justify-content: space-between;
    border-color: transparent;
    background: transparent;
  }

  .button:disabled {
    cursor: wait;
    opacity: 0.7;
  }
</style>
