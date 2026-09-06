<script lang="ts">
  let { title }: { title?: string } = $props();
</script>

<span class="theme-glyph relative inline-block size-[1em] shrink-0 align-[-.08em] [&_svg]:absolute [&_svg]:inset-0 [&_svg]:block [&_svg]:size-full [&_svg]:overflow-hidden [&_svg]:fill-current [&_svg]:transition-[opacity,transform] [&_svg]:duration-(--motion-duration-fast) [&_svg]:ease-standard" aria-hidden={title ? undefined : "true"}>
  <svg
    class="sun scale-100 theme-dark:scale-[.94] theme-dark:opacity-0"
    viewBox="0 0 13.276 13.276"
    role={title ? "img" : undefined}
    aria-label={title}
  >
    <circle cx="6.638" cy="6.638" r="6.638" />
  </svg>
  <svg
    class="moon scale-[.94] opacity-0 theme-dark:scale-100 theme-dark:opacity-100"
    viewBox="1.624 5.1 13.276 13.276"
    role={title ? "img" : undefined}
    aria-label={title}
  >
    <path d="M14.9 13.65A6.8 6.8 0 0 1 6.35 5.1 6.8 6.8 0 1 0 14.9 13.65Z" />
  </svg>
</span>
