<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import ThemeGlyph from "../icons/ThemeGlyph.svelte";

  let {
    navigation,
    pathname,
    theme,
    display,
  }: {
    navigation: ReadonlyArray<{ href: string; label: string }>;
    pathname: string;
    theme?: Snippet;
    display?: Snippet;
  } = $props();

  function isCurrent(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  let ready = $state(false);

  onMount(() => {
    ready = true;
    document.documentElement.dataset.js = "true";
  });
</script>

<!--
  A single hairline bar. Home renders no header at all; there the masthead is the identity, so this
  carries the same wordmark at control size. Its C is the sun-and-moon mark, decorative here — the
  whole wordmark stays the way back to Home — and both preference controls sit at the other end.
-->
<header class="relative z-(--z-header) border-b border-rule" data-ready={ready}>
  <div class="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-x-(--space-6) gap-y-(--space-1) px-(--layout-gutter)">
<!-- The mark is small type; the link around it is a full-size target. -->
    <a class="flex min-h-control shrink-0 items-center font-stretch-104% text-small leading-none font-strong tracking-heading text-ink uppercase no-underline pressable [--press-scale:0.97] hover:no-underline" href="/">
      <span class="sr-only">Lunacea</span>
      <span class="flex items-baseline" aria-hidden="true">
        <span>LUNA</span>
        <span class="relative inline-block"><span class="invisible">C</span>
          <span class="absolute top-1/2 left-1/2 block size-[.94em] -translate-x-1/2 -translate-y-[calc(50%+.06em)] [&_.theme-glyph]:size-full [&_.theme-glyph]:align-baseline">
            <ThemeGlyph />
          </span>
        </span>
        <span>EA</span>
      </span>
    </a>

    <nav class="ml-auto flex flex-wrap items-center gap-x-(--space-5) font-stretch-84% text-folio tracking-folio uppercase" aria-label="主要ナビゲーション">
      {#each navigation as item}
        <a
          class="relative inline-flex min-h-control items-center text-quiet no-underline pressable [--press-scale:0.96] before:absolute before:inset-y-0 before:-inset-x-(--space-2) before:content-[''] after:absolute after:inset-x-0 after:bottom-[calc(50%-.85em)] after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-[scale] after:duration-(--motion-duration-base) after:ease-standard hover:text-ink hover:no-underline hover:after:scale-x-100 focus-visible:text-ink focus-visible:after:scale-x-100 aria-[current=page]:text-ink aria-[current=page]:after:scale-x-100 motion-off:after:duration-(--motion-duration-immediate)"
          href={item.href}
          aria-current={isCurrent(item.href) ? "page" : undefined}
        >{item.label}</a>
      {/each}
    </nav>

    <div class="flex shrink-0 items-center gap-x-(--space-1)">
      {#if theme}<div class="header-theme h-(--control-size)">{@render theme()}</div>{/if}
      {#if display}<div class="header-display h-(--control-size)">{@render display()}</div>{/if}
    </div>
  </div>
</header>
