<script lang="ts">
  import { onMount, tick } from "svelte";
  import { visualAssets } from "@lunacea/config";
  import * as Collapsible from "../primitives/collapsible";
  import Icon from "../icons/Icon.svelte";
  import { interfaceIcons } from "../icons/semantic.ts";
  import MediaSlot from "../visuals/MediaSlot.svelte";

  let {
    navigation,
    pathname
  }: {
    navigation: ReadonlyArray<{ href: string; label: string }>;
    pathname: string;
  } = $props();

  let open = $state(false);
  let ready = $state(false);
  let menuButton = $state<HTMLButtonElement | null>(null);
  let currentPathname = $state("");

  $effect(() => {
    if (pathname !== currentPathname) {
      currentPathname = pathname;
      open = false;
    }
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
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<header data-ready={ready}>
  <div class="shell inner">
    <a class="brand" href="/" aria-label="Lunacea ホーム">
      {#if visualAssets.identity.src}
        <MediaSlot asset={visualAssets.identity} class="identity" />
      {/if}
      <span>Lunacea</span>
    </a>

    <nav class="desktop-nav" aria-label="主要ナビゲーション">
      {#each navigation as item}
        <a href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
          {item.label}
        </a>
      {/each}
      <a class="search" href="/search" aria-current={pathname === "/search" ? "page" : undefined}>
        <Icon name={interfaceIcons.search} />Search
      </a>
    </nav>

    <Collapsible.Root class="mobile-nav" bind:open>
      <Collapsible.Trigger
        bind:ref={menuButton}
        class="menu-trigger"
        aria-controls="mobile-navigation"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      >
        <span class="menu-label">Menu</span>
        <span class="menu-icon" aria-hidden="true"><i></i><i></i></span>
      </Collapsible.Trigger>
      <Collapsible.Content id="mobile-navigation" class="mobile-panel">
        <nav aria-label="主要ナビゲーション（モバイル）">
        {#each navigation as item, index}
          <a
            href={item.href}
            aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            onclick={() => void dismissMenu()}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
          </a>
        {/each}
        <a
          href="/search"
          aria-current={pathname === "/search" ? "page" : undefined}
          onclick={() => void dismissMenu()}
        >
          <span>06</span><Icon name={interfaceIcons.search} />Search
        </a>
        </nav>
      </Collapsible.Content>
    </Collapsible.Root>
  </div>
</header>

<style>
  header {
    position: sticky;
    z-index: var(--z-header);
    top: 0;
    border-bottom: 1px solid var(--color-line);
    background: color-mix(in srgb, var(--color-background) 96%, var(--color-surface));
  }

  .inner {
    display: flex;
    min-height: 4.25rem;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-8);
  }

  .brand {
    display: inline-flex;
    min-height: var(--control-size);
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    line-height: var(--leading-none);
    text-decoration: none;
    view-transition-name: site-identity;
  }

  .brand :global(.identity) {
    width: 1.75rem;
  }

  nav {
    display: flex;
    align-items: center;
    gap: clamp(var(--space-3), 2vw, var(--space-6));
  }

  nav a,
  :global(.menu-trigger) {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-ui);
    text-decoration: none;
  }

  nav a {
    display: inline-flex;
    min-height: var(--control-size);
    align-items: center;
    border-bottom: 1px solid transparent;
  }

  nav a[aria-current="page"],
  nav a:hover {
    border-color: var(--color-accent);
    color: var(--color-foreground);
  }

  .search {
    gap: var(--space-2);
    border-left: 1px solid var(--color-line);
    padding-left: var(--space-5);
  }

  .search :global(svg),
  :global(.mobile-panel svg) {
    flex: none;
    font-size: var(--text-small);
  }

  :global(.mobile-nav) {
    display: none;
  }

  @media (max-width: 52rem) {
    .desktop-nav {
      display: none;
    }

    :global(.mobile-nav) {
      display: block;
    }

    .inner {
      gap: var(--space-2);
    }

    :global(.menu-trigger) {
      display: flex;
      min-width: var(--control-size);
      min-height: var(--control-size);
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      border: 0;
      padding: 0;
      background: transparent;
      color: var(--color-muted);
      cursor: pointer;
    }

    .menu-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }

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
      transition: transform var(--motion-duration-fast) var(--motion-ease-standard);
    }

    .menu-icon i + i {
      transform: translateY(3px);
    }

    :global(.menu-trigger[data-state="open"]) .menu-icon i {
      transform: rotate(45deg);
    }

    :global(.menu-trigger[data-state="open"]) .menu-icon i + i {
      transform: rotate(-45deg);
    }

    :global(.mobile-panel) nav {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      display: grid;
      border-block: 1px solid var(--color-line);
      padding: var(--space-3) var(--layout-gutter) var(--space-6);
      background: var(--color-surface);
    }

    :global(.mobile-panel) nav a {
      justify-content: space-between;
      border-bottom-color: var(--color-line);
      font-family: var(--font-serif);
      font-size: var(--text-h3);
    }

    :global(.mobile-panel) nav span {
      order: 2;
      color: var(--color-muted);
      font-family: var(--font-mono);
      font-size: var(--text-caption);
    }

    :global(html:not([data-js]) .mobile-panel) {
      display: block !important;
    }
  }
</style>
