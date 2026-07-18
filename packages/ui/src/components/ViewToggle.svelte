<script lang="ts">
  import Icon from "../icons/Icon.svelte";
  import { interfaceIcons } from "../icons/semantic.ts";

  let {
    value,
    gridHref,
    listHref,
  }: {
    value: "grid" | "list";
    gridHref: string;
    listHref: string;
  } = $props();

</script>

<nav class="view-toggle" aria-label="表示形式">
  <a
    href={gridHref}
    aria-label="グリッド表示"
    title="Grid"
    aria-current={value === "grid" ? "true" : undefined}
    data-sveltekit-noscroll
    data-sveltekit-keepfocus
  >
    <Icon name={interfaceIcons.grid} />
  </a>
  <a
    href={listHref}
    aria-label="リスト表示"
    title="List"
    aria-current={value === "list" ? "true" : undefined}
    data-sveltekit-noscroll
    data-sveltekit-keepfocus
  >
    <Icon name={interfaceIcons.list} />
  </a>
</nav>

<style>
  .view-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-small);
  }

  a {
    display: grid;
    width: var(--control-size);
    min-height: var(--control-size);
    place-items: center;
    color: var(--color-muted);
    text-decoration: none;
  }

  a[aria-current="true"] {
    color: var(--color-background);
    background: var(--color-foreground);
  }

  a :global(svg) {
    font-size: var(--text-body);
  }
</style>
