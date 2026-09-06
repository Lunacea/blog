<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";
  import * as Collapsible from "../primitives/collapsible";
  import HeaderSearch from "./HeaderSearch.svelte";
  import { announceHeaderDisclosure, listenForHeaderDisclosure } from "./header-disclosures.ts";

  let {
    navigation,
    pathname,
    searchQuery = "",
    theme,
    display,
  }: {
    navigation: ReadonlyArray<{ href: string; label: string }>;
    pathname: string;
    searchQuery?: string;
    theme?: Snippet;
    display?: Snippet;
  } = $props();

  let open = $state(false);
  let ready = $state(false);
  let menuButton = $state<HTMLButtonElement | null>(null);
  let controlRegion = $state<HTMLElement | null>(null);
  let currentPathname = $state("");
  let articleCompact = $state(false);
  const articleDetail = $derived(/^\/articles\/[^/]+\/?$/u.test(pathname));
  // Search belongs to the catalog; Home and the reading surface stay free of it.
  const searchable = $derived(/^\/articles\/?$/u.test(pathname));
  const navigationLinkClass = "relative isolate flex min-h-(--control-size) w-full items-center justify-end overflow-hidden px-(--space-2) py-(--space-1) text-right text-small tracking-ui text-quiet no-underline transition-[color,background] duration-(--motion-duration-fast) ease-standard before:absolute before:inset-0 before:-z-1 before:origin-right before:scale-x-0 before:-skew-x-12 before:bg-[color-mix(in_srgb,var(--color-foreground)_10%,transparent)] before:transition-transform before:duration-(--motion-duration-micro) before:ease-enter hover:bg-[color-mix(in_srgb,var(--color-surface)_72%,transparent)] hover:text-ink hover:no-underline hover:before:origin-left hover:before:scale-x-[1.08] hover:before:skew-x-0 focus-visible:bg-[color-mix(in_srgb,var(--color-surface)_72%,transparent)] focus-visible:text-ink focus-visible:before:origin-left focus-visible:before:scale-x-[1.08] focus-visible:before:skew-x-0 aria-[current=page]:bg-ink aria-[current=page]:text-canvas motion-reduced:duration-(--motion-duration-immediate) motion-reduced:before:duration-(--motion-duration-immediate) motion-off:duration-(--motion-duration-immediate) motion-off:before:duration-(--motion-duration-immediate)";

  function isCurrent(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  $effect(() => {
    if (pathname !== currentPathname) {
      currentPathname = pathname;
      open = false;
      articleCompact = false;
    }
  });

  $effect(() => {
    if (open) announceHeaderDisclosure("menu");
  });

  async function dismissMenu(returnFocus = false) {
    if (!open) return;
    open = false;
    if (returnFocus) {
      await tick();
      menuButton?.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    void dismissMenu(true);
  }

  onMount(() => {
    ready = true;
    document.documentElement.dataset.js = "true";
    const desktop = matchMedia("(min-width: 52rem)");
    let articleTriggerBottom = 0;
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) open = false;
    };
    desktop.addEventListener("change", closeAtDesktop);
    const stopDisclosure = listenForHeaderDisclosure("menu", () => open = false);
    let frame = 0;
    const updateArticleMode = () => {
      frame = 0;
      if (!articleDetail || !controlRegion) {
        articleCompact = false;
        return;
      }
      if (!desktop.matches) {
        articleCompact = false;
        return;
      }
      const marker = document.querySelector<HTMLElement>("[data-reading-start]");
      if (!marker) {
        articleCompact = false;
        return;
      }
      if (!articleCompact) {
        articleTriggerBottom = controlRegion.getBoundingClientRect().bottom;
      }
      articleCompact = marker.getBoundingClientRect().top <= articleTriggerBottom + 8;
      if (!articleCompact) open = false;
    };
    const scheduleArticleMode = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateArticleMode);
    };
    addEventListener("scroll", scheduleArticleMode, { passive: true });
    addEventListener("resize", scheduleArticleMode);
    const routeObserver = new MutationObserver(scheduleArticleMode);
    const main = document.querySelector("main");
    if (main) routeObserver.observe(main, { childList: true, subtree: true });
    queueMicrotask(scheduleArticleMode);
    return () => {
      desktop.removeEventListener("change", closeAtDesktop);
      stopDisclosure();
      if (frame) cancelAnimationFrame(frame);
      removeEventListener("scroll", scheduleArticleMode);
      removeEventListener("resize", scheduleArticleMode);
      routeObserver.disconnect();
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="pointer-events-none fixed inset-0 z-(--z-header) h-0 home-opening:animate-home-header-enter [html:not([data-js])_&]:relative [html:not([data-js])_&]:h-auto [html:not([data-js])_&]:px-(--layout-gutter) [html:not([data-js])_&]:pt-[calc(env(safe-area-inset-top)+var(--space-3))] [html:not([data-js])_&]:pb-(--space-3)" data-ready={ready}>
  <div class="control-region pointer-events-auto absolute top-[calc(env(safe-area-inset-top)+var(--layout-gutter))] right-[calc(env(safe-area-inset-right)+var(--layout-gutter))] w-[calc(var(--header-menu-width)+(2*var(--control-size))+(2*var(--space-1)))] data-[searchable=true]:w-[calc(var(--header-menu-width)+(3*var(--control-size))+(3*var(--space-1)))] max-md:block data-[article-compact=true]:[&_.desktop-nav]:pointer-events-none data-[article-compact=true]:[&_.desktop-nav]:invisible data-[article-compact=true]:[&_.desktop-nav]:-translate-y-(--space-3) data-[article-compact=true]:[&_.desktop-nav]:opacity-0 data-[article-compact=true]:[&_.mobile-nav]:pointer-events-auto data-[article-compact=true]:[&_.mobile-nav]:visible data-[article-compact=true]:[&_.mobile-nav]:animate-compact-control-in [html:not([data-js])_&]:hidden" bind:this={controlRegion} data-article-compact={articleCompact} data-searchable={searchable}>
    <nav class="desktop-nav absolute top-0 right-0 grid w-(--header-menu-width) justify-items-stretch gap-(--space-3) transition-[opacity,transform] duration-(--motion-duration-micro) ease-exit max-md:hidden motion-reduced:duration-(--motion-duration-immediate) motion-off:duration-(--motion-duration-immediate)" aria-label="主要ナビゲーション">
      {#each navigation as item}
        <a class={navigationLinkClass} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header-actions grid grid-cols-[var(--control-size)_var(--control-size)_var(--header-menu-width)] items-center in-data-[searchable=true]:grid-cols-[var(--control-size)_var(--control-size)_var(--control-size)_var(--header-menu-width)] gap-(--space-1) [&_button:not(.menu-trigger):not(.theme-toggle)]:relative [&_button:not(.menu-trigger):not(.theme-toggle)]:isolate [&_button:not(.menu-trigger):not(.theme-toggle)]:overflow-hidden [&_button:not(.menu-trigger):not(.theme-toggle)]:transition-colors [&_button:not(.menu-trigger):not(.theme-toggle)]:duration-(--motion-duration-fast) [&_button:not(.menu-trigger):not(.theme-toggle)]:before:absolute [&_button:not(.menu-trigger):not(.theme-toggle)]:before:inset-0 [&_button:not(.menu-trigger):not(.theme-toggle)]:before:-z-1 [&_button:not(.menu-trigger):not(.theme-toggle)]:before:translate-y-[115%] [&_button:not(.menu-trigger):not(.theme-toggle)]:before:skew-y-9 [&_button:not(.menu-trigger):not(.theme-toggle)]:before:bg-[color-mix(in_srgb,var(--color-foreground)_11%,transparent)] [&_button:not(.menu-trigger):not(.theme-toggle)]:before:transition-transform [&_button:not(.menu-trigger):not(.theme-toggle)]:before:duration-(--motion-duration-micro) [&_button:not(.menu-trigger):not(.theme-toggle)]:before:ease-enter [&_button:not(.menu-trigger):not(.theme-toggle):hover]:before:translate-y-0 [&_button:not(.menu-trigger):not(.theme-toggle):hover]:before:skew-y-0 [&_button:not(.menu-trigger):not(.theme-toggle):focus-visible]:before:translate-y-0 [&_button:not(.menu-trigger):not(.theme-toggle):focus-visible]:before:skew-y-0 motion-reduced:[&_button]:duration-(--motion-duration-immediate) motion-off:[&_button]:duration-(--motion-duration-immediate)">
      {#if theme}<div class="header-theme col-start-1 h-(--control-size)">{@render theme()}</div>{/if}
      {#if display}<div class="header-display col-start-2 h-(--control-size)">{@render display()}</div>{/if}
      {#if searchable}
        <div class="header-search-slot col-start-3 h-(--control-size)"><HeaderSearch value={searchQuery} /></div>
      {/if}
      <Collapsible.Root class="mobile-nav relative col-start-3 block in-data-[searchable=true]:col-start-4 invisible pointer-events-none max-md:visible max-md:pointer-events-auto" bind:open>
        <Collapsible.Trigger
          bind:ref={menuButton}
          class="menu-trigger grid min-h-(--control-size) w-(--header-menu-width) cursor-pointer place-items-center border-0 bg-ink p-0 text-canvas hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas data-[state=closed]:hover:[&_.menu-icon_i:first-child]:transform-[translateX(-2px)] data-[state=closed]:hover:[&_.menu-icon_i:last-child]:transform-[translateX(2px)] data-[state=closed]:focus-visible:[&_.menu-icon_i:first-child]:transform-[translateX(-2px)] data-[state=closed]:focus-visible:[&_.menu-icon_i:last-child]:transform-[translateX(2px)] data-[state=open]:bg-ink data-[state=open]:text-canvas data-[state=open]:hover:[&_.menu-icon]:transform-[rotate(90deg)] data-[state=open]:focus-visible:[&_.menu-icon]:transform-[rotate(90deg)]"
          aria-controls="site-navigation"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        >
          <span class="menu-icon relative block h-(--space-4) w-(--space-5) transition-transform duration-(--motion-duration-micro) ease-standard [button[data-state=open]_&]:rotate-0 [button[data-state=open]:hover_&]:rotate-90 [button[data-state=open]:focus-visible_&]:rotate-90 [&_i]:absolute [&_i]:top-[calc(50%-1px)] [&_i]:left-0 [&_i]:h-px [&_i]:w-full [&_i]:-translate-y-0.75 [&_i]:bg-current [&_i]:transition-transform [&_i]:duration-(--motion-duration-micro) [&_i]:ease-standard [&_i+_i]:translate-y-0.75 [button:not([data-state=open]):hover_&_i]:-translate-x-0.5 [button:not([data-state=open]):focus-visible_&_i]:-translate-x-0.5 [button:not([data-state=open]):hover_&_i+_i]:translate-x-0.5 [button:not([data-state=open]):focus-visible_&_i+_i]:translate-x-0.5 [button[data-state=open]_&_i]:translate-y-0 [button[data-state=open]_&_i]:rotate-45 [button[data-state=open]_&_i+_i]:-rotate-45" aria-hidden="true"><i></i><i></i></span>
        </Collapsible.Trigger>
        <Collapsible.Content id="site-navigation" class="menu-panel absolute top-[calc(100%+var(--space-2))] right-0 z-(--z-overlay) w-(--header-menu-width) max-w-[calc(100vw-2*var(--layout-gutter))] origin-top-right border border-rule bg-(--color-glass) p-(--space-3) shadow-ui-overlay backdrop-blur-glass data-[state=open]:animate-disclosure-in data-[state=closed]:animate-disclosure-out">
          <nav class="grid justify-items-stretch gap-(--space-3)" aria-label="主要ナビゲーション（モバイル）">
            {#each navigation as item}
              <a
                class={navigationLinkClass}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                onclick={() => void dismissMenu()}
              >
                {item.label}
              </a>
            {/each}
          </nav>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  </div>

  <div class="no-js-header hidden grid-cols-1 gap-(--space-3) pointer-events-auto [html:not([data-js])_&]:grid">
    <nav class="no-js-nav flex flex-wrap gap-x-(--space-5) gap-y-(--space-3)" aria-label="JavaScriptなしのサイトナビゲーション">
      {#each navigation as item}<a class="text-caption text-quiet" href={item.href}>{item.label}</a>{/each}
    </nav>
    {#if searchable}<HeaderSearch value={searchQuery} variant="static" />{/if}
  </div>
</header>
