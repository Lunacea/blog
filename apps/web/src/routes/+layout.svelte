<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { ambientIntensity, ambientWeather } from "$lib/weather.ts";
  import { FontPreloads, SettingsPanel, SiteFooter, SiteHeader, ThemeToggle } from "$ui/components";
  import "$ui/foundations/global.css";
  import { installAnchorNavigation, installPageTransitions, installScrollInertia } from "$ui/motion";
  import EditorialLight from "$ui/visuals/EditorialLight.svelte";
  import {
    parseWeatherVisualIntensityOverride,
    parseWeatherVisualOverride,
  } from "$ui/visuals/weather-visual.ts";
  import { primaryNavigation, siteConfig } from "@lunacea/config";
  import { onMount } from "svelte";

  let { children } = $props();
  const masthead = $derived(page.url.pathname === "/");
  /*
    場はここで一度だけ持つ。ルートごとにマウントすると遷移のたびに
    WebGL が破棄・再生成され、背景が一度消えてから戻るので明暗の谷になる。
    同じ要素が居座れば、ページが変わっても外の景色は途切れない。
  */
  const condition = $derived(
    (dev ? parseWeatherVisualOverride(page.url.searchParams.get("weather")) : null) ??
      $ambientWeather,
  );
  const intensity = $derived(
    (dev ? parseWeatherVisualIntensityOverride(page.url.searchParams.get("intensity")) : null) ??
      $ambientIntensity,
  );
  installPageTransitions();
  // 地色は html の属性から決まるので、上書きもそこへ当てる。
  // 事前描画されていて天候を読まない記事ページでも ?weather= で確認できる。
  $effect(() => {
    if (!dev) return;
    const condition = parseWeatherVisualOverride(page.url.searchParams.get("weather"));
    const intensity = parseWeatherVisualIntensityOverride(page.url.searchParams.get("intensity"));
    if (condition) document.documentElement.dataset.weather = condition;
    if (intensity) document.documentElement.dataset.intensity = intensity;
  });
  onMount(() => {
    const stopAnchorNavigation = installAnchorNavigation();
    const stopScrollInertia = installScrollInertia();
    return () => {
      stopAnchorNavigation();
      stopScrollInertia();
    };
  });
</script>

<svelte:head>
  {#if siteConfig.sampleMode}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<a class="fixed top-(--space-2) left-(--space-2) z-(--z-skip-link) min-h-control-size translate-y-[-150%] bg-panel px-(--space-4) py-(--space-3) transition-transform duration-(--motion-duration-fast) ease-enter focus:translate-y-0" href="#main-content">本文へ移動</a>
<FontPreloads />
{#if !masthead}
  <SiteHeader navigation={primaryNavigation} pathname={page.url.pathname}>
    {#snippet theme()}<ThemeToggle />{/snippet}
    {#snippet display()}<SettingsPanel />{/snippet}
  </SiteHeader>
{/if}
<main class="relative z-(--z-visual)" id="main-content">
  <!-- 負のレイヤーがページ背景より上に来るよう main の中に置く。 -->
  <EditorialLight {condition} {intensity} />
  {@render children()}
</main>
<SiteFooter
  name={siteConfig.name}
  email={siteConfig.author.email}
  github={siteConfig.author.github}
  x={siteConfig.author.x}
  startYear={2025}
>
  {#snippet theme()}<ThemeToggle />{/snippet}
  {#snippet display()}<SettingsPanel />{/snippet}
</SiteFooter>
