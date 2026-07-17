<script lang="ts">
  import ArrowRightUpIcon from "../icons/ArrowRightUpIcon.svelte";

  let {
    href,
    title,
    description,
    site
  }: {
    href: string;
    title: string;
    description: string;
    site: string;
  } = $props();
</script>

<a class="link-card" {href} rel="noreferrer" target="_blank">
  <span class="site">{site}</span>
  <strong>{title}</strong>
  <span class="description">{description}</span>
  <span class="arrow" aria-hidden="true"><ArrowRightUpIcon /></span>
</a>

<style>
  .link-card {
    position: relative;
    display: grid;
    gap: var(--space-1);
    margin-block: var(--space-8);
    border: 1px solid var(--color-line);
    padding: var(--space-5) var(--space-14) var(--space-5) var(--space-5);
    background: var(--color-surface);
    text-decoration: none;
  }

  .site,
  .description {
    color: var(--color-muted);
  }

  .site {
    font-size: var(--text-caption);
    text-transform: uppercase;
  }

  strong {
    font-weight: var(--weight-emphasis);
  }

  .description {
    font-size: var(--text-small);
    line-height: var(--leading-card);
  }

  .arrow {
    position: absolute;
    top: var(--space-5);
    right: var(--space-5);
    color: var(--color-accent);
  }

  .arrow :global(svg) {
    display: block;
  }
</style>
