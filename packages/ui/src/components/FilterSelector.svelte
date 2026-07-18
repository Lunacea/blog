<script lang="ts">
  let {
    label,
    options,
  }: {
    label: string;
    options: ReadonlyArray<{ label: string; href: string; active: boolean; count?: number }>;
  } = $props();
</script>

{#if options.length}
  <nav class="filter-selector" aria-label={label}>
    <span>{label}</span>
    <div>
      {#each options as option}
        <a
          href={option.href}
          aria-current={option.active ? "true" : undefined}
          data-sveltekit-noscroll
        >
          <span>{option.label}</span>
          {#if option.count !== undefined}<small>{option.count}</small>{/if}
        </a>
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
    display: grid;
    grid-template-columns: minmax(4.5rem, .14fr) minmax(0, 1fr);
    gap: var(--space-1) var(--space-3);
  }

  .filter-selector > span {
    color: var(--color-muted);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-ui);
    line-height: var(--leading-ui);
  }

  .filter-selector div {
    gap: var(--space-1);
  }

  a {
    position: relative;
    z-index: calc(var(--z-controls) + 1);
    display: inline-flex;
    min-height: var(--space-8);
    align-items: center;
    gap: var(--space-1);
    border: 1px solid var(--color-line);
    padding-inline: var(--space-2);
    color: var(--color-muted);
    background: var(--color-background);
    font-size: var(--text-caption);
    line-height: var(--leading-ui);
    text-decoration: none;
    transition:
      color var(--motion-duration-micro) var(--motion-ease-standard),
      background var(--motion-duration-micro) var(--motion-ease-standard);
  }

  a:hover {
    color: var(--color-foreground);
    border-color: var(--color-foreground);
  }

  a[aria-current="true"] {
    border-color: var(--color-foreground);
    color: var(--color-background);
    background: var(--color-foreground);
  }

  small {
    opacity: .64;
    font-size: inherit;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 44rem) {
    .filter-selector { grid-template-columns: 1fr; }
  }
</style>
