<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";
  import * as Collapsible from "../primitives/collapsible";
  import { announceHeaderDisclosure, listenForHeaderDisclosure } from "./header-disclosures.ts";

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

  let open = $state(false);
  let ready = $state(false);
  let menuButton = $state<HTMLButtonElement | null>(null);
  let controlRegion = $state<HTMLElement | null>(null);
  let currentPathname = $state("");
  let articleCompact = $state(false);
  const articleDetail = $derived(/^\/articles\/[^/]+\/?$/u.test(pathname));

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

<header data-ready={ready}>
  <div class="control-region" bind:this={controlRegion} data-article-compact={articleCompact}>
    <nav class="desktop-nav" aria-label="主要ナビゲーション">
      {#each navigation as item}
        <a href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header-actions">
      {#if theme}<div class="header-theme">{@render theme()}</div>{/if}
      {#if display}<div class="header-display">{@render display()}</div>{/if}
      <Collapsible.Root class="mobile-nav" bind:open>
        <Collapsible.Trigger
          bind:ref={menuButton}
          class="menu-trigger"
          aria-controls="site-navigation"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        >
          <span class="menu-icon" aria-hidden="true"><i></i><i></i></span>
        </Collapsible.Trigger>
        <Collapsible.Content id="site-navigation" class="menu-panel">
          <nav aria-label="主要ナビゲーション（モバイル）">
            {#each navigation as item}
              <a
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

  <nav class="no-js-nav" aria-label="JavaScriptなしのサイトナビゲーション">
    {#each navigation as item}<a href={item.href}>{item.label}</a>{/each}
  </nav>
</header>

<style>
  header {
    position: fixed;
    z-index: var(--z-header);
    inset: 0;
    height: 0;
    pointer-events: none;
  }

  .control-region {
    position: absolute;
    top: calc(env(safe-area-inset-top) + var(--layout-gutter));
    right: calc(env(safe-area-inset-right) + var(--layout-gutter));
    display: grid;
    justify-items: end;
    gap: var(--space-6);
    pointer-events: auto;
  }

  .desktop-nav {
    display: grid;
    justify-items: stretch;
    gap: var(--space-3);
    transition:
      opacity var(--motion-duration-fast) var(--motion-ease-standard),
      transform var(--motion-duration-micro) var(--motion-ease-exit);
  }

  .desktop-nav a,
  :global(.menu-panel a) {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding: var(--space-1) var(--space-2);
    color: var(--color-muted);
    font-size: var(--text-small);
    letter-spacing: var(--tracking-ui);
    text-decoration: none;
    transition: color var(--motion-duration-fast) var(--motion-ease-standard),
      background var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .desktop-nav a {
    width: 100%;
    text-align: right;
  }

  .desktop-nav a::before,
  :global(.menu-panel a::before) {
    position: absolute;
    z-index: var(--z-backdrop);
    inset: 0;
    background: color-mix(in srgb, var(--color-foreground) 10%, transparent);
    content: "";
    transform: scaleX(0) skewX(-12deg);
    transform-origin: right center;
    transition: transform var(--motion-duration-micro) var(--motion-ease-enter);
  }

  .desktop-nav a:hover::before,
  .desktop-nav a:focus-visible::before,
  :global(.menu-panel a:hover::before),
  :global(.menu-panel a:focus-visible::before) {
    transform: scaleX(1.08) skewX(0);
    transform-origin: left center;
  }

  .desktop-nav a:hover,
  .desktop-nav a:focus-visible {
    color: var(--color-foreground);
    background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  }

  .desktop-nav a[aria-current="page"],
  :global(.menu-panel a[aria-current="page"]) {
    color: var(--color-background);
    background: var(--color-foreground);
  }

  .desktop-nav a:hover,
  .desktop-nav a[aria-current="page"] {
    text-decoration: none;
  }

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
  }

  .header-actions :global(button:not(.menu-trigger):not(.theme-toggle)) {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    transition: color var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .header-actions :global(button:not(.menu-trigger):not(.theme-toggle)::before) {
    position: absolute;
    z-index: var(--z-backdrop);
    inset: 0;
    background: color-mix(in srgb, var(--color-foreground) 11%, transparent);
    content: "";
    transform: translateY(115%) skewY(9deg);
    transition: transform var(--motion-duration-micro) var(--motion-ease-enter);
  }

  .header-actions :global(button:not(.menu-trigger):not(.theme-toggle):hover::before),
  .header-actions :global(button:not(.menu-trigger):not(.theme-toggle):focus-visible::before) {
    transform: translateY(0) skewY(0);
  }

  :global(.mobile-nav) {
    position: relative;
    display: none;
  }

  .control-region[data-article-compact="true"] .desktop-nav {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    transform: translateY(calc(var(--space-3) * -1));
    visibility: hidden;
  }

  .control-region[data-article-compact="true"] :global(.mobile-nav) {
    display: block;
    animation: compact-control-in var(--motion-duration-micro) var(--motion-ease-enter);
  }

  :global(.menu-trigger) {
    display: grid;
    width: var(--control-size);
    min-height: var(--control-size);
    place-items: center;
    border: 0;
    padding: 0;
    background: var(--color-foreground);
    color: var(--color-background);
    cursor: pointer;
  }

  :global(.menu-trigger:hover),
  :global(.menu-trigger:focus-visible),
  :global(.menu-trigger[data-state="open"]) {
    background: var(--color-foreground);
    color: var(--color-background);
  }

  .menu-icon {
    position: relative;
    display: block;
    width: var(--space-5);
    height: var(--space-4);
    transition: transform var(--motion-duration-micro) var(--motion-ease-standard);
  }

  .menu-icon i {
    position: absolute;
    top: calc(50% - 1px);
    left: 0;
    width: 100%;
    height: 1px;
    background: currentColor;
    transform: translateY(-3px);
    transition: transform var(--motion-duration-micro) var(--motion-ease-standard);
  }

  .menu-icon i + i { transform: translateY(3px); }

  :global(.menu-trigger:not([data-state="open"]):hover) .menu-icon i,
  :global(.menu-trigger:not([data-state="open"]):focus-visible) .menu-icon i {
    transform: translate(-2px, -3px);
  }

  :global(.menu-trigger:not([data-state="open"]):hover) .menu-icon i + i,
  :global(.menu-trigger:not([data-state="open"]):focus-visible) .menu-icon i + i {
    transform: translate(2px, 3px);
  }

  :global(.menu-trigger[data-state="open"]) .menu-icon i { transform: rotate(45deg); }
  :global(.menu-trigger[data-state="open"]) .menu-icon i + i { transform: rotate(-45deg); }

  :global(.menu-trigger[data-state="open"]:hover) .menu-icon,
  :global(.menu-trigger[data-state="open"]:focus-visible) .menu-icon {
    transform: rotate(90deg);
  }

  :global(.menu-panel) {
    position: absolute;
    z-index: var(--z-overlay);
    top: calc(100% + var(--space-2));
    right: 0;
    width: max-content;
    max-width: calc(100vw - 2 * var(--layout-gutter));
    padding: var(--space-3);
    border: 1px solid var(--color-line);
    background: var(--color-glass);
    box-shadow: var(--shadow-overlay);
    backdrop-filter: blur(var(--glass-blur));
    transform-origin: top right;
  }

  :global(.menu-panel[data-state="open"]) {
    animation: disclosure-in var(--motion-duration-base) var(--motion-ease-enter);
  }

  :global(.menu-panel[data-state="closed"]) {
    animation: disclosure-out var(--motion-duration-fast) var(--motion-ease-exit);
  }

  :global(.menu-panel nav) {
    display: grid;
    justify-items: stretch;
    gap: var(--space-3);
  }

  :global(.menu-panel nav a) {
    display: block;
    width: 100%;
    min-height: auto;
    font-family: var(--font-sans);
    font-size: var(--text-small);
    text-align: right;
  }

  @keyframes disclosure-in {
    from {
      opacity: 0;
      transform: translateY(calc(var(--space-2) * -1));
    }
  }

  @keyframes disclosure-out {
    to {
      opacity: 0;
      transform: translateY(calc(var(--space-2) * -1));
    }
  }

  @keyframes compact-control-in {
    from {
      opacity: 0;
      transform: translateY(calc(var(--space-2) * -1));
    }
  }

  .no-js-nav { display: none; }

  @media (max-width: 52rem) {
    .control-region { display: block; }
    .desktop-nav { display: none; }
    :global(.mobile-nav) { display: block; }
  }

  :global(html[data-motion="reduced"]) .desktop-nav,
  :global(html[data-motion="off"]) .desktop-nav {
    transition-duration: var(--motion-duration-immediate);
  }

  :global(html[data-motion="reduced"]) .desktop-nav a::before,
  :global(html[data-motion="off"]) .desktop-nav a::before,
  :global(html[data-motion="reduced"]) .header-actions :global(button),
  :global(html[data-motion="off"]) .header-actions :global(button),
  :global(html[data-motion="reduced"]) .header-actions :global(button::before),
  :global(html[data-motion="off"]) .header-actions :global(button::before) {
    transition-duration: var(--motion-duration-immediate);
  }

  :global(html[data-motion="reduced"]) .control-region[data-article-compact="true"] :global(.mobile-nav),
  :global(html[data-motion="off"]) .control-region[data-article-compact="true"] :global(.mobile-nav) {
    animation-duration: var(--motion-duration-immediate);
  }

  :global(html:not([data-js])) header {
    position: relative;
    height: auto;
    padding: calc(env(safe-area-inset-top) + var(--space-3)) var(--layout-gutter) var(--space-3);
  }

  :global(html:not([data-js]) .control-region) { display: none; }

  :global(html:not([data-js]) .no-js-nav) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-5);
    pointer-events: auto;
  }

  :global(html:not([data-js]) .no-js-nav a) {
    color: var(--color-muted);
    font-size: var(--text-caption);
  }
</style>
