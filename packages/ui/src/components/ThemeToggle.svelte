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

  let { placement = "header" }: { placement?: "header" | "masthead" } = $props();
  let theme = $state<EffectiveTheme>("light");
  /** Hydration signal: the control only responds once this is true. */
  let ready = $state(false);

  function refresh() {
    theme = applyThemePreference(readThemePreference()).theme;
  }

  function toggle() {
    theme = setThemePreference(theme === "dark" ? "light" : "dark").theme;
  }

  onMount(() => {
    refresh();
    ready = true;
    const stop = subscribeThemeCapability(refresh);
    addEventListener("lunacea:theme", refresh);
    return () => {
      stop();
      removeEventListener("lunacea:theme", refresh);
    };
  });
</script>

<!-- One monochrome sun-and-moon mark, drawn at control size in the bar and at display size as the C. -->
<button
  class={cn(
    "theme-toggle group cursor-pointer border-0 bg-transparent p-0",
    placement === "header" &&
      "inline-grid size-control min-h-control place-items-center text-xl text-quiet pressable [--press-scale:0.9] hover:text-ink focus-visible:text-ink",
    placement === "masthead" &&
      "block size-full min-h-0 text-ink [&_.theme-glyph]:size-full [&_.theme-glyph]:align-baseline transition-[scale,rotate] duration-(--motion-duration-base) ease-spring motion-full:hover:scale-[1.14] motion-full:hover:rotate-[-10deg] motion-full:focus-visible:scale-[1.14] motion-full:focus-visible:rotate-[-10deg] active:scale-[0.96] motion-full:hover:active:scale-[1.04] motion-full:hover:active:rotate-[-4deg] motion-off:duration-(--motion-duration-immediate)",
  )}
  type="button"
  aria-label={theme === "dark" ? "ライトテーマに切り替える" : "ダークテーマに切り替える"}
  aria-pressed={theme === "dark"}
  data-ready={ready}
  onclick={toggle}
>
  <ThemeGlyph />
  <span class="sr-only">{theme === "dark" ? "Dark theme" : "Light theme"}</span>
</button>
