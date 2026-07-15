<script lang="ts">
  import { visualAssets } from "@lunacea/config";
  import MediaSlot from "./MediaSlot.svelte";

  let {
    navigation,
    pathname
  }: {
    navigation: ReadonlyArray<{ href: string; label: string }>;
    pathname: string;
  } = $props();
</script>

<header>
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
        Search
      </a>
    </nav>

    <details class="mobile-nav">
      <summary>Menu</summary>
      <nav aria-label="主要ナビゲーション（モバイル）">
        {#each navigation as item, index}
          <a href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
          </a>
        {/each}
        <a href="/search" aria-current={pathname === "/search" ? "page" : undefined}>
          <span>06</span>Search
        </a>
      </nav>
    </details>
  </div>
</header>

<style>
  header {
    position: sticky;
    z-index: 20;
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
    line-height: 1;
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
  summary {
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
    border-left: 1px solid var(--color-line);
    padding-left: var(--space-5);
  }

  .mobile-nav {
    display: none;
  }

  @media (max-width: 52rem) {
    .desktop-nav {
      display: none;
    }

    .mobile-nav {
      display: block;
    }

    summary {
      display: grid;
      min-width: 4.5rem;
      min-height: var(--control-size);
      cursor: pointer;
      list-style: none;
      place-items: center end;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    .mobile-nav nav {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      display: grid;
      border-block: 1px solid var(--color-line);
      padding: var(--space-3) var(--layout-gutter) var(--space-6);
      background: var(--color-surface);
    }

    .mobile-nav nav a {
      justify-content: space-between;
      border-bottom-color: var(--color-line);
      font-family: var(--font-serif);
      font-size: var(--text-h3);
    }

    .mobile-nav nav span {
      order: 2;
      color: var(--color-muted);
      font-family: var(--font-mono);
      font-size: var(--text-caption);
    }
  }
</style>
