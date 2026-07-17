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
  let currentPathname = $state("");

  function isCurrent(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  $effect(() => {
    if (pathname !== currentPathname) {
      currentPathname = pathname;
      open = false;
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
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) open = false;
    };
    desktop.addEventListener("change", closeAtDesktop);
    const stopDisclosure = listenForHeaderDisclosure("menu", () => open = false);
    return () => {
      desktop.removeEventListener("change", closeAtDesktop);
      stopDisclosure();
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<header data-ready={ready}>
  <div class="control-region">
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
    justify-items: end;
    gap: var(--space-3);
  }

  .desktop-nav a,
  :global(.menu-panel a) {
    color: var(--color-muted);
    font-size: var(--text-small);
    letter-spacing: var(--tracking-ui);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    text-decoration-thickness: 1px;
    text-underline-offset: var(--space-2);
    transition: color var(--motion-duration-fast) var(--motion-ease-standard),
      text-decoration-color var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .desktop-nav a:hover,
  .desktop-nav a:focus-visible,
  .desktop-nav a[aria-current="page"] {
    color: var(--color-foreground);
    text-decoration-color: currentColor;
  }

  .desktop-nav a[aria-current="page"]::before {
    content: "";
    display: inline-block;
    width: var(--space-2);
    height: 1px;
    margin-right: var(--space-2);
    background: currentColor;
    vertical-align: middle;
  }

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
  }

  :global(.mobile-nav) {
    position: relative;
    display: none;
  }

  :global(.menu-trigger) {
    display: grid;
    width: var(--control-size);
    min-height: var(--control-size);
    place-items: center;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
  }

  :global(.menu-trigger:hover),
  :global(.menu-trigger[data-state="open"]) { color: var(--color-foreground); }

  .menu-icon {
    position: relative;
    display: block;
    width: var(--space-5);
    height: var(--space-4);
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
  :global(.menu-trigger[data-state="open"]) .menu-icon i { transform: rotate(45deg); }
  :global(.menu-trigger[data-state="open"]) .menu-icon i + i { transform: rotate(-45deg); }

  :global(.menu-panel) {
    position: absolute;
    z-index: var(--z-overlay);
    top: calc(100% + var(--space-2));
    right: 0;
    width: max-content;
    max-width: calc(100vw - 2 * var(--layout-gutter));
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
    justify-items: end;
    gap: var(--space-3);
  }

  :global(.menu-panel nav a) {
    display: block;
    min-height: auto;
    font-family: var(--font-sans);
    font-size: var(--text-small);
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

  .no-js-nav { display: none; }

  @media (max-width: 52rem) {
    .control-region { display: block; }
    .desktop-nav { display: none; }
    :global(.mobile-nav) { display: block; }
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
