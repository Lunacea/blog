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
  import { cn } from "../utils.ts";

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
  class={cn(
    "theme-toggle inline-grid size-control min-h-control cursor-pointer place-items-center border-0 bg-transparent p-0 text-xl text-quiet transition-colors duration-(--motion-duration-fast) ease-standard hover:text-signal focus-visible:text-signal aria-pressed:text-ink",
    placement === "title" && "size-full min-h-full text-inherit text-signal align-[inherit] hover:rotate-6 hover:scale-[1.04] hover:text-signal focus-visible:text-signal aria-pressed:text-signal",
  )}
  type="button"
  aria-label={theme === "dark" ? "ライトテーマに切り替える" : "ダークテーマに切り替える"}
  aria-pressed={theme === "dark"}
  onclick={toggle}
>
  <ThemeGlyph />
  <span class="sr-only">{theme === "dark" ? "Dark theme" : "Light theme"}</span>
</button>
