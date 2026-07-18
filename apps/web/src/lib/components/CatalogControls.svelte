<script lang="ts">
  import type { Snippet } from "svelte";
  import { Icon, interfaceIcons } from "$ui/icons";

  let {
    searchId,
    searchLabel,
    searchValue = "",
    resultCount,
    activeFilterCount = 0,
    hiddenFields = [],
    clearHref,
    onsubmit,
    children,
  }: {
    searchId: string;
    searchLabel: string;
    searchValue?: string;
    resultCount: number;
    activeFilterCount?: number;
    hiddenFields?: ReadonlyArray<{ name: string; value: string }>;
    clearHref?: string;
    onsubmit?: (event: SubmitEvent) => void;
    children: Snippet;
  } = $props();

</script>

<section class="catalog-controls" aria-label={searchLabel}>
  <div class="control-heading">
    <span>Search & filters</span>
    <span>
      {resultCount} records{activeFilterCount ? ` / ${activeFilterCount} active` : ""}
    </span>
  </div>

  <form
    method="GET"
    role="search"
    onsubmit={onsubmit}
    data-sveltekit-noscroll
    data-sveltekit-keepfocus
  >
    <label for={searchId}>{searchLabel}</label>
    <div class="search-row">
      <input
        id={searchId}
        type="search"
        name="q"
        value={searchValue}
        maxlength="120"
      />
      {#each hiddenFields as field (`${field.name}:${field.value}`)}
        <input type="hidden" name={field.name} value={field.value} />
      {/each}
      <button type="submit" aria-label={searchLabel} title={searchLabel}>
        <Icon name={interfaceIcons.search} />
      </button>
    </div>
  </form>

  <div class="filter-groups">
    {@render children()}
  </div>

  <div class="clear-slot">
    {#if clearHref}
      <a
        class="clear"
        href={clearHref}
        data-sveltekit-noscroll
        aria-label="条件を解除"
        title="条件を解除"
      >
        <Icon name={interfaceIcons.reset} />
      </a>
    {:else}
      <button class="clear" type="button" disabled aria-label="解除する条件はありません">
        <Icon name={interfaceIcons.reset} />
      </button>
    {/if}
  </div>
</section>

<style>
  .catalog-controls {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-8);
  }

  .control-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: flex-start;
    gap: var(--space-2);
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
    letter-spacing: var(--tracking-ui);
  }

  form {
    display: grid;
    max-width: calc(var(--layout-grid-wide) + var(--space-32));
    gap: var(--space-1);
  }

  form > label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .search-row {
    position: relative;
    z-index: calc(var(--z-controls) + 1);
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--space-10);
    background: var(--color-background);
  }

  input,
  button {
    min-height: var(--space-8);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-size: var(--text-caption);
  }

  input {
    min-width: 0;
    padding-inline: var(--space-2);
  }

  button {
    display: grid;
    place-items: center;
    border-left: 0;
    padding: 0;
    cursor: pointer;
  }

  .search-row button:hover,
  .search-row button:focus-visible {
    color: var(--color-background);
    background: var(--color-foreground);
  }

  button :global(svg) {
    font-size: var(--text-small);
  }

  .filter-groups {
    display: grid;
    gap: var(--space-2);
  }

  .clear-slot {
    min-height: var(--space-8);
  }

  .clear {
    display: grid;
    width: var(--space-8);
    min-height: var(--space-8);
    place-items: center;
    border: 1px solid var(--color-line);
    padding: 0;
    color: var(--color-muted);
    background: transparent;
    font-size: var(--text-small);
    text-decoration: none;
  }

  a.clear:hover,
  a.clear:focus-visible {
    border-color: var(--color-foreground);
    color: var(--color-background);
    background: var(--color-foreground);
  }

  button.clear:disabled {
    cursor: default;
    opacity: .36;
  }
</style>
