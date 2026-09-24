<script module lang="ts">
  let activeThemeTransition: ViewTransition | undefined;
  let activeThemeTarget: "light" | "dark" | undefined;
  let themeTransitionId = 0;
</script>

<script lang="ts">
  import { ThemeGlyph } from "@lunacea/ui/icons";
  import { cn } from "@lunacea/ui/utils";
  import { onMount, tick } from "svelte";
  import {
      applyThemePreference,
      hasRenderingHeadroom,
      readThemePreference,
      setThemePreference,
      subscribeThemeCapability,
      type EffectiveTheme,
  } from "./preferences.ts";

  let { placement = "header" }: { placement?: "header" | "masthead" } = $props();
  let theme = $state<EffectiveTheme>("light");
  /** ハイドレーション済みかどうか。true になるまでこの操作子は反応しない。 */
  let ready = $state(false);

  function refresh() {
    theme = applyThemePreference(readThemePreference()).theme;
  }

  function toggle() {
    const next = (activeThemeTarget ?? theme) === "dark" ? "light" : "dark";
    const root = document.documentElement;
    // 全画面の溶暗は撮影と合成が重い。背景の WebGL を諦める端末では即時に切り替える。
    const headroom = hasRenderingHeadroom();
    if (root.dataset.motion !== "full" || !document.startViewTransition || !headroom) {
      themeTransitionId++;
      activeThemeTransition?.skipTransition();
      activeThemeTransition = undefined;
      activeThemeTarget = undefined;
      // 色トークンの補間も毎フレーム文書全体を再計算させるので、余裕のない端末では止める。
      if (headroom) delete root.dataset.themeTransition;
      else root.dataset.themeTransition = "instant";
      theme = setThemePreference(next).theme;
      if (!headroom) {
        const id = themeTransitionId;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (id === themeTransitionId) delete root.dataset.themeTransition;
          })
        );
      }
      return;
    }

    // 色の継承を毎フレーム再計算せず、画面のスナップショットを同じ長さで溶暗する。
    const id = ++themeTransitionId;
    activeThemeTarget = next;
    activeThemeTransition?.skipTransition();
    root.dataset.themeTransition = "active";
    const transition = document.startViewTransition(async () => {
      if (id !== themeTransitionId) return;
      theme = setThemePreference(next).theme;
      await tick();
    });
    activeThemeTransition = transition;
    // 連打で省略した遷移の ready は AbortError で reject する。
    void transition.ready.catch(() => {});
    const cleanup = () => {
      if (activeThemeTransition !== transition) return;
      activeThemeTransition = undefined;
      activeThemeTarget = undefined;
      delete root.dataset.themeTransition;
    };
    void transition.finished.then(cleanup, cleanup);
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

<button
  class={cn(
    "theme-toggle group cursor-pointer border-0 bg-transparent p-0",
    placement === "header" &&
      "has-tooltip inline-grid size-control min-h-control place-items-center text-xl text-quiet pressable [--press-scale:0.9] hover:text-ink focus-visible:text-ink",
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
  {#if placement === "header"}
    <!-- 題字の C は題字の一部なので吹き出しを付けない。ボタンが同じ名前を持つので読ませない。 -->
    <span class="tooltip" aria-hidden="true"><span>{theme === "dark" ? "明るくする" : "暗くする"}</span></span>
  {/if}
</button>
