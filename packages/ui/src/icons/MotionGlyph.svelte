<script lang="ts">
  let { mode }: { mode: "full" | "reduced" | "off" } = $props();
</script>

<svg
  class="motion-glyph"
  data-mode={mode}
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <g class="wave wave-primary">
    <path
      data-stroke="wave"
      d="M-24 12C-18 4 -18 4 -12 12S-6 20 0 12S6 4 12 12S18 20 24 12S30 4 36 12S42 20 48 12"
    />
  </g>
  <g class="wave wave-secondary">
    <path
      data-stroke="wave"
      d="M-24 12C-18 4 -18 4 -12 12S-6 20 0 12S6 4 12 12S18 20 24 12S30 4 36 12S42 20 48 12"
    />
  </g>
</svg>

<style>
  .motion-glyph {
    width: var(--space-6);
    height: var(--space-6);
    overflow: hidden;
  }

  .wave {
    opacity: 0;
    transform: scaleY(.001);
    transform-box: view-box;
    transform-origin: 12px 12px;
    transition:
      transform var(--motion-duration-micro) var(--motion-ease-enter),
      opacity var(--motion-duration-fast) var(--motion-ease-standard);
  }

  [data-mode="off"] .wave-primary {
    opacity: 1;
    transform: scaleY(.001);
  }

  [data-mode="reduced"] .wave-primary {
    opacity: 1;
    transform: scaleY(1);
  }

  [data-mode="full"] .wave-primary {
    opacity: 1;
    transform: translateY(-4px) scaleY(.58);
  }

  [data-mode="full"] .wave-secondary {
    opacity: 1;
    transform: translateY(4px) scaleY(.58);
  }

  path {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    /* SVG coordinate-space weight: optical match for the 24×24 glyph. */
    stroke-width: 1.75;
    vector-effect: non-scaling-stroke;
  }

  :global(html[data-motion="reduced"]) .wave,
  :global(html[data-motion="off"]) .wave {
    transition-duration: var(--motion-duration-immediate);
  }

  :global(.settings-trigger[data-motion-feedback="true"]) .wave {
    transition-duration:
      var(--motion-duration-micro),
      var(--motion-duration-fast) !important;
  }
</style>
