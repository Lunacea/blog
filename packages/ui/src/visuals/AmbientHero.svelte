<script lang="ts">
  import WeatherAtmosphere from "./WeatherAtmosphere.svelte";
  import { onMount, tick } from "svelte";
  import type { Component } from "svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  type Quality = "low" | "high";
  type HeroPalette = {
    foreground: string;
    primary: string;
    accent: string;
  };
  type Connection = { saveData?: boolean };

  let { weather = "neutral" }: { weather?: WeatherVisualCondition } = $props();

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
  let yaw = $state(0);
  let pitch = $state(0);
  let dragging = $state(false);
  let pointerIntent = $state<"idle" | "pending" | "drag" | "scroll">("idle");
  let pointerId: number | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pendingYaw = 0;
  let pendingPitch = 0;
  let repelX = $state(0);
  let repelY = $state(0);
  let repelAspect = $state(1);
  let repelActive = $state(0);
  let dragFrame = 0;
  let paletteFrame = 0;
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
      repelActive = 0;
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
    repelActive = 0;
    Scene = null;
    enabled = false;
  }

  function refreshPalette(duration = 0) {
    cancelAnimationFrame(paletteFrame);
    const started = performance.now();
    const sample = (now: number) => {
      palette = readPalette();
      if (now - started < duration) paletteFrame = requestAnimationFrame(sample);
      else paletteFrame = 0;
    };
    paletteFrame = requestAnimationFrame(sample);
  }

  function commitDrag() {
    dragFrame = 0;
    yaw += pendingYaw;
    pitch = Math.max(-.65, Math.min(.65, pitch + pendingPitch));
    pendingYaw = 0;
    pendingPitch = 0;
  }

  function startDrag(event: PointerEvent) {
    if (!event.isPrimary) return;
    pointerId = event.pointerId;
    pointerIntent = "pending";
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerX = event.clientX;
    pointerY = event.clientY;
  }

  function moveDrag(event: PointerEvent) {
    updateRepulsion(event);
    if (pointerId !== event.pointerId || pointerIntent === "idle" || pointerIntent === "scroll") return;
    const fromStartX = event.clientX - pointerStartX;
    const fromStartY = event.clientY - pointerStartY;
    if (pointerIntent === "pending" && Math.hypot(fromStartX, fromStartY) > 7) {
      if (Math.abs(fromStartX) > Math.abs(fromStartY) * 1.25) {
        pointerIntent = "drag";
        dragging = true;
        repelActive = 0;
        ambientHost.setPointerCapture(event.pointerId);
      } else {
        pointerIntent = "scroll";
        pointerId = null;
        return;
      }
    }
    if (pointerIntent !== "drag") return;
    pendingYaw += (event.clientX - pointerX) * .006;
    pendingPitch += (event.clientY - pointerY) * .004;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!dragFrame) dragFrame = requestAnimationFrame(commitDrag);
  }

  function stopDrag(event: PointerEvent) {
    if (pointerId !== event.pointerId && !dragging) return;
    if (dragFrame) {
      cancelAnimationFrame(dragFrame);
      commitDrag();
    }
    dragging = false;
    if (ambientHost.hasPointerCapture(event.pointerId)) ambientHost.releasePointerCapture(event.pointerId);
    pointerIntent = "idle";
    pointerId = null;
    if (event.pointerType !== "touch" && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      repelActive = 1;
    }
  }

  function updateRepulsion(event: PointerEvent) {
    if (
      !enabled || document.documentElement.dataset.motion !== "full" ||
      event.pointerType === "touch" || pointerIntent === "drag" ||
      !matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      repelActive = 0;
      return;
    }
    const rect = canvasHost.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    repelX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    repelY = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    repelAspect = rect.width / rect.height;
    repelActive = 1;
  }

  function stopRepulsion() {
    repelActive = 0;
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
    const themeListener = () => refreshPalette(900);
    window.addEventListener("lunacea:motion", motionListener);
    window.addEventListener("lunacea:theme", themeListener);
    return () => {
      generation += 1;
      cancelAnimationFrame(dragFrame);
      cancelAnimationFrame(paletteFrame);
      intersectionObserver.disconnect();
      if (useIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.removeEventListener("lunacea:motion", motionListener);
      window.removeEventListener("lunacea:theme", themeListener);
    };
  });
</script>

<div
  class="ambient absolute inset-0 z-(--z-content) touch-pan-y overflow-hidden text-support max-md:opacity-68 max-xs:opacity-56"
  bind:this={ambientHost}
  aria-hidden="true"
  data-webgl={enabled}
  data-weather={weather}
  data-quality={quality}
  data-pointer-intent={pointerIntent}
  data-yaw={yaw}
  data-pitch={pitch}
  data-repel-active={repelActive}
  data-repel-x={repelX}
  data-repel-y={repelY}
  data-cursor={dragging ? "drag" : "webgl"}
  onpointerdown={startDrag}
  onpointermove={moveDrag}
  onpointerup={stopDrag}
  onpointercancel={stopDrag}
  onpointerleave={stopRepulsion}
>
  <span class="palette-probe foreground absolute size-0 overflow-hidden text-ink" bind:this={foregroundProbe}></span>
  <span class="palette-probe primary absolute size-0 overflow-hidden text-support" bind:this={primaryProbe}></span>
  <span class="palette-probe accent absolute size-0 overflow-hidden text-signal" bind:this={accentProbe}></span>
  <div class="weather-fallback pointer-events-none absolute inset-0">
    <WeatherAtmosphere condition={weather} />
  </div>
  <div class="canvas absolute top-0 right-0 left-0 h-[min(200svh,100%)] w-full" bind:this={canvasHost}>
    {#if Scene && palette}
      <Scene
        {quality}
        {palette}
        {yaw}
        {pitch}
        pointerX={repelX}
        pointerY={repelY}
        pointerAspect={repelAspect}
        pointerActive={repelActive}
      />
    {/if}
  </div>
</div>
