<script lang="ts">
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
  <a href={gridHref} aria-current={value === "grid" ? "true" : undefined}>Grid</a>
  <a href={listHref} aria-current={value === "list" ? "true" : undefined}>List</a>
</nav>

<style>
  .view-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    font-size: var(--text-small);
  }

  a {
    min-height: var(--control-size);
    color: var(--color-muted);
    text-decoration-color: transparent;
    text-underline-offset: .45em;
  }

  a[aria-current="true"] {
    color: var(--color-foreground);
    text-decoration-color: var(--color-accent);
  }
</style>
