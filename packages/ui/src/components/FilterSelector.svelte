<script lang="ts">
  let {
    label,
    options,
  }: {
    label: string;
    options: ReadonlyArray<{ label: string; href: string; active: boolean }>;
  } = $props();
</script>

{#if options.length}
  <nav class="filter-selector" aria-label={label}>
    <span>{label}</span>
    <div>
      {#each options as option}
        <a href={option.href} aria-current={option.active ? "true" : undefined}>{option.label}</a>
      {/each}
    </div>
  </nav>
{/if}

<style>
  .filter-selector,
  .filter-selector div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
  }

  .filter-selector {
    gap: var(--space-3) var(--space-6);
  }

  .filter-selector > span {
    color: var(--color-muted);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-ui);
  }

  .filter-selector div {
    gap: var(--space-2) var(--space-5);
  }

  a {
    min-height: var(--control-size);
    color: var(--color-muted);
    text-decoration-color: transparent;
    text-decoration-thickness: 2px;
    transition:
      color var(--motion-duration-micro) var(--motion-ease-standard),
      text-decoration-color var(--motion-duration-micro) var(--motion-ease-standard);
  }

  a:hover,
  a[aria-current="true"] {
    color: var(--color-foreground);
    text-decoration-color: var(--color-accent);
  }
</style>
