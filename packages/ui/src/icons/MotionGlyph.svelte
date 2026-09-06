<script lang="ts">
  let { mode }: { mode: "full" | "reduced" | "off" } = $props();
</script>

<svg
  class="motion-glyph size-(--space-6) overflow-hidden [&_.wave]:origin-[12px_12px] [&_.wave]:transform-view [&_.wave]:scale-y-[.001] [&_.wave]:opacity-0 [&_.wave]:transition-[scale,translate,opacity] [&_.wave]:duration-(--motion-duration-fast) [&_.wave]:ease-standard motion-reduced:[&_.wave]:duration-(--motion-duration-immediate) data-[mode=off]:[&_.wave-primary]:scale-y-[.001] data-[mode=off]:[&_.wave-primary]:opacity-100 data-[mode=reduced]:[&_.wave-primary]:scale-y-100 data-[mode=reduced]:[&_.wave-primary]:opacity-100 data-[mode=full]:[&_.wave-primary]:-translate-y-1 data-[mode=full]:[&_.wave-primary]:scale-y-[.58] data-[mode=full]:[&_.wave-primary]:opacity-100 data-[mode=full]:[&_.wave-secondary]:translate-y-1 data-[mode=full]:[&_.wave-secondary]:scale-y-[.58] data-[mode=full]:[&_.wave-secondary]:opacity-100 [&_path]:fill-none [&_path]:stroke-current [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round] [&_path]:stroke-[1.75] [&_path]:[vector-effect:non-scaling-stroke]"
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
