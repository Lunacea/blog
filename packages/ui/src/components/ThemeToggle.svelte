<script lang="ts">
  import { onMount } from "svelte";
  import ThemeGlyph from "../icons/ThemeGlyph.svelte";
  import {
    applyThemePreference,
    readThemePreference,
    setThemePreference,
    subscribeThemeCapability,
    type EffectiveTheme,
  } from "../motion/preferences.ts";

  let { placement = "header" }: { placement?: "header" | "title" } = $props();
  let theme = $state<EffectiveTheme>("light");

  function refresh() {
    theme = applyThemePreference(readThemePreference()).theme;
  }

  function toggle() {
    theme = setThemePreference(theme === "dark" ? "light" : "dark").theme;
  }

  onMount(() => {
    refresh();
    const stop = subscribeThemeCapability(refresh);
    addEventListener("lunacea:theme", refresh);
    return () => {
      stop();
      removeEventListener("lunacea:theme", refresh);
    };
  });
</script>

<button
  class="theme-toggle"
  class:title-toggle={placement === "title"}
  type="button"
  aria-label={theme === "dark" ? "ライトテーマに切り替える" : "ダークテーマに切り替える"}
  aria-pressed={theme === "dark"}
  onclick={toggle}
>
  <ThemeGlyph />
  <span>{theme === "dark" ? "Dark theme" : "Light theme"}</span>
</button>

<style>
  .theme-toggle {
    display: inline-grid;
    width: var(--control-size);
    min-height: var(--control-size);
    place-items: center;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    font-size: var(--space-5);
    transform-origin: center;
    transition: color var(--motion-duration-fast) var(--motion-ease-standard),
      transform var(--motion-duration-fast) var(--motion-ease-enter);
  }

  .theme-toggle:hover,
  .theme-toggle[aria-pressed="true"] {
    color: var(--color-foreground);
  }

  .theme-toggle:hover {
    transform: rotate(8deg) scale(1.08);
  }

  .theme-toggle:active {
    transform: rotate(2deg) scale(.94);
  }

  .title-toggle {
    width: 100%;
    min-height: 100%;
    color: var(--color-accent);
    font-size: inherit;
    vertical-align: inherit;
  }

  .title-toggle:hover {
    color: var(--color-primary);
    transform: rotate(6deg) scale(1.04);
  }

  .theme-toggle > span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
</style>
