<script lang="ts">
  import { Icon, socialIcons } from "$ui/icons";

  let { title, url }: { title: string; url: string } = $props();
  const text = $derived(`${title}\n${url}`);
  const xHref = $derived(`https://x.com/intent/post?text=${encodeURIComponent(text)}`);
</script>

<nav class="share-actions" aria-label="SNSでシェア">
  <a href={xHref} target="_blank" rel="noreferrer">
    <Icon name={socialIcons.x} />
    <span>Share</span>
  </a>
</nav>

<style>
  .share-actions {
    display: flex;
    align-items: center;
  }

  a {
    display: inline-flex;
    min-height: var(--space-10);
    align-items: center;
    gap: var(--space-2);
    border: 1px solid var(--color-line);
    padding-inline: var(--space-3);
    color: inherit;
    background: transparent;
    font-size: var(--text-caption);
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    border-color: var(--color-foreground);
    color: var(--color-background);
    background: var(--color-foreground);
  }

  a :global(svg) {
    font-size: var(--text-small);
  }
</style>
