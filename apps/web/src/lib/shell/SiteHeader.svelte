<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { ThemeGlyph } from "@lunacea/ui/icons";

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

<!-- ホームはヘッダを持たない（題字がアイデンティティ）ため、ここでは同じ題字を操作サイズで出す。 -->
<header class="site-header sticky top-0 z-(--z-header) border-b border-rule bg-(--color-glass) backdrop-blur-glass" data-ready={ready}>
  <div class="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-x-(--space-4) gap-y-(--space-1) xs:gap-x-(--space-6) px-(--layout-gutter) py-(--space-2)">
    <a class="flex min-h-control shrink-0 items-center font-stretch-104% text-small xs:text-body leading-none font-strong tracking-heading text-ink uppercase no-underline pressable [--press-scale:0.97] hover:no-underline" href="/">
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

    <nav class="flex flex-wrap items-center gap-x-(--space-5) font-stretch-84% text-folio xs:text-caption tracking-folio uppercase" aria-label="主要ナビゲーション">
      {#each navigation as item}
        <a
          class="ink-underline inline-flex min-h-control items-center text-quiet no-underline pressable [--press-scale:0.96] before:absolute before:inset-y-0 before:-inset-x-(--space-2) before:content-[''] hover:text-ink hover:no-underline focus-visible:text-ink aria-[current=page]:text-ink"
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
