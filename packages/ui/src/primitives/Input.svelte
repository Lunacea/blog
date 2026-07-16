<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = Omit<HTMLInputAttributes, "value"> & {
    value?: string;
    variant?: "default" | "query";
  };

  let {
    value = $bindable(""),
    variant = "default",
    class: className = "",
    ...restProps
  }: Props = $props();
</script>

<input bind:value class={`input ${className}`} data-variant={variant} {...restProps} />

<style>
  .input {
    width: 100%;
    min-width: 0;
    min-height: var(--control-size);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-3);
    background: var(--color-background);
  }

  .input[data-variant="query"] {
    min-height: var(--space-16);
    border: 0;
    border-bottom: 1px solid var(--color-line);
    padding: 0;
    background: transparent;
    font-family: var(--font-serif);
    font-size: var(--text-h2);
  }
</style>
