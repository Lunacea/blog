<script lang="ts">
  import Icon from "../icons/Icon.svelte";
  import type { ApprovedIconName } from "../icons/Icon.svelte";

  let {
    categories,
  }: {
    categories: readonly {
      title: string;
      technologies: readonly { label: string; icon: ApprovedIconName }[];
    }[];
  } = $props();
</script>

<section class="engineering" aria-labelledby="engineering-title">
  <h2 id="engineering-title">Engineering</h2>
  <div class="category-grid">
    {#each categories as category}
      <section class="category" aria-labelledby={`engineering-${category.title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}>
        <h3 id={`engineering-${category.title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}>
          {category.title}
        </h3>
        <ul>
          {#each category.technologies as technology}
            <li>
              <span class="technology-icon"><Icon name={technology.icon} /></span>
              <span>{technology.label}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
</section>

<style>
  .engineering {
    width: 100%;
  }

  h2 {
    margin: 0 0 var(--space-8);
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    font-weight: var(--weight-regular);
    line-height: var(--leading-heading);
    text-align: center;
    overflow-wrap: anywhere;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-10) var(--space-8);
  }

  .category {
    min-width: 0;
  }

  .category h3 {
    margin: 0 0 var(--space-4);
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-weight: var(--weight-label);
    letter-spacing: var(--tracking-label);
    line-height: var(--leading-ui);
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  ul {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: var(--space-5) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-small);
    line-height: var(--leading-ui);
  }

  li > span:last-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .technology-icon {
    display: grid;
    width: var(--space-4);
    place-items: center;
    justify-self: center;
    color: var(--color-secondary);
  }

  .technology-icon :global(svg) {
    display: block;
    width: 1em;
    height: 1em;
  }

  @media (max-width: 52rem) {
    .category-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: var(--space-8);
    }
  }

  @media (max-width: 34rem) {
    .category-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
