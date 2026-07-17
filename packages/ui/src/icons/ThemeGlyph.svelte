<script lang="ts">
  let { title }: { title?: string } = $props();
</script>

<span class="theme-glyph" aria-hidden={title ? undefined : "true"}>
  <svg
    class="sun"
    viewBox="0 0 13.276 13.276"
    role={title ? "img" : undefined}
    aria-label={title}
  >
    <circle cx="6.638" cy="6.638" r="6.638" />
  </svg>
  <svg
    class="moon"
    viewBox="1.624 5.1 13.276 13.276"
    role={title ? "img" : undefined}
    aria-label={title}
  >
    <path d="M14.9 13.65A6.8 6.8 0 0 1 6.35 5.1 6.8 6.8 0 1 0 14.9 13.65Z" />
  </svg>
</span>

<style>
  .theme-glyph {
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
    flex: none;
    vertical-align: -0.08em;
  }

  svg {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    fill: currentColor;
    transition: opacity var(--motion-duration-fast) var(--motion-ease-standard),
      transform var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .sun {
    transform: scale(1);
  }

  .moon {
    opacity: 0;
    transform: scale(.94);
  }

  :global(html[data-theme="dark"]) .sun {
    opacity: 0;
    transform: scale(.94);
  }

  :global(html[data-theme="dark"]) .moon {
    opacity: 1;
    transform: scale(1);
  }
</style>
