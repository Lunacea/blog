<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Component } from "svelte";

  type Quality = "low" | "high";
  type HeroPalette = { foreground: string; primary: string; accent: string };
  type Connection = { saveData?: boolean };

  let Scene = $state<Component<Record<string, unknown>> | null>(null);
  let enabled = $state(false);
  let quality = $state<Quality>("low");
  let palette = $state<HeroPalette | null>(null);
  let ambientHost: HTMLDivElement;
  let canvasHost: HTMLDivElement;
  let foregroundProbe: HTMLSpanElement;
  let primaryProbe: HTMLSpanElement;
  let accentProbe: HTMLSpanElement;
  let inViewport = $state(true);
  let generation = 0;

  function readPalette(): HeroPalette {
    return {
      // Read the computed `color`, not the custom-property source text, so light-dark() is resolved.
      foreground: getComputedStyle(foregroundProbe).color,
      primary: getComputedStyle(primaryProbe).color,
      accent: getComputedStyle(accentProbe).color,
    };
  }

  function capability(): Quality | null {
    try {
      if (document.documentElement.dataset.motion !== "full") return null;
      if (matchMedia("(forced-colors: active)").matches || !inViewport) return null;
      const connection = (navigator as Navigator & { connection?: Connection }).connection;
      if (connection?.saveData) return null;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      const cores = navigator.hardwareConcurrency || 4;
      if (memory <= 2 || cores <= 2) return null;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", {
        antialias: false,
        powerPreference: "low-power",
      });
      if (!context) return null;
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return memory >= 8 && cores >= 8 && devicePixelRatio <= 2 ? "high" : "low";
    } catch {
      return null;
    }
  }

  async function evaluate() {
    const currentGeneration = ++generation;
    const supportedQuality = capability();
    palette = readPalette();
    if (!supportedQuality) {
      enabled = false;
      Scene = null;
      return;
    }
    try {
      const imported = await import("./HeroScene.svelte");
      if (currentGeneration !== generation) return;
      quality = supportedQuality;
      Scene = imported.default as Component<Record<string, unknown>>;
      enabled = true;
      await tick();
      canvasHost?.querySelector("canvas")?.addEventListener("webglcontextlost", disable, {
        once: true,
      });
    } catch {
      disable();
    }
  }

  function disable() {
    generation += 1;
    Scene = null;
    enabled = false;
  }

  onMount(() => {
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry?.isIntersecting ?? false;
      void evaluate();
    });
    intersectionObserver.observe(ambientHost);
    const useIdle = "requestIdleCallback" in window;
    const idle = useIdle
      ? window.requestIdleCallback(() => void evaluate(), { timeout: 1200 })
      : window.setTimeout(() => void evaluate(), 280);
    const motionListener = () => void evaluate();
    const themeListener = () => {
      palette = readPalette();
    };
    window.addEventListener("lunacea:motion", motionListener);
    window.addEventListener("lunacea:theme", themeListener);
    return () => {
      generation += 1;
      intersectionObserver.disconnect();
      if (useIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.removeEventListener("lunacea:motion", motionListener);
      window.removeEventListener("lunacea:theme", themeListener);
    };
  });
</script>

<div
  class="ambient"
  bind:this={ambientHost}
  aria-hidden="true"
  data-webgl={enabled}
  data-quality={quality}
>
  <span class="palette-probe foreground" bind:this={foregroundProbe}></span>
  <span class="palette-probe primary" bind:this={primaryProbe}></span>
  <span class="palette-probe accent" bind:this={accentProbe}></span>
  <svg class="fallback" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="hero-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="currentColor" stop-opacity=".42" />
        <stop offset=".55" stop-color="currentColor" stop-opacity=".06" />
        <stop offset="1" stop-color="var(--color-accent)" stop-opacity=".2" />
      </linearGradient>
      <radialGradient id="hero-signal">
        <stop offset="0" stop-color="var(--color-accent)" stop-opacity=".32" />
        <stop offset="1" stop-color="var(--color-accent)" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g class="axis">
      <line x1="400" y1="92" x2="400" y2="708" />
      <line x1="168" y1="400" x2="632" y2="400" />
      <ellipse cx="400" cy="400" rx="218" ry="74" />
      <ellipse cx="400" cy="400" rx="102" ry="286" />
    </g>
    <rect
      class="solid"
      x="300"
      y="112"
      width="200"
      height="576"
      rx="100"
      fill="url(#hero-glass)"
    />
    <ellipse class="core" cx="400" cy="406" rx="104" ry="190" />
    <circle class="signal" cx="520" cy="255" r="112" fill="url(#hero-signal)" />
  </svg>
  <div class="canvas" bind:this={canvasHost}>
    {#if Scene && palette}<Scene {quality} {palette} />{/if}
  </div>
</div>

<style>
  .ambient {
    position: absolute;
    z-index: var(--z-content);
    inset: 0 -4% 0 42%;
    overflow: hidden;
    color: var(--color-secondary);
    pointer-events: none;
  }

  .fallback,
  .canvas {
    width: 100%;
    height: 100%;
  }

  .palette-probe {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  .palette-probe.foreground {
    color: var(--color-foreground);
  }

  .palette-probe.primary {
    color: var(--color-secondary);
  }

  .palette-probe.accent {
    color: var(--color-accent);
  }

  .fallback {
    opacity: 0.72;
    transition: opacity var(--motion-duration-base) var(--motion-ease-standard);
  }

  [data-webgl="true"] .fallback {
    opacity: 0.08;
  }

  .canvas {
    position: absolute;
    inset: 0;
  }

  .axis {
    fill: none;
    stroke: var(--color-line);
    stroke-width: 1;
  }

  .solid {
    stroke: currentColor;
    stroke-width: 1.25;
  }

  .core {
    fill: color-mix(in srgb, var(--color-primary) 14%, transparent);
    stroke: var(--color-secondary);
    stroke-width: 1;
  }

  @media (max-width: 52rem) {
    .ambient {
      inset: 12% -38% 30% 28%;
      opacity: 0.62;
    }
  }

  @media (max-width: 34rem) {
    .ambient {
      inset: 8% -60% 38% 20%;
      opacity: 0.5;
    }
  }
</style>
