<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Component } from "svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  type Quality = "low" | "high";
  type HeroPalette = { foreground: string; primary: string; accent: string };
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
  let dragFrame = 0;
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
    if (pointerId !== event.pointerId || pointerIntent === "idle" || pointerIntent === "scroll") return;
    const fromStartX = event.clientX - pointerStartX;
    const fromStartY = event.clientY - pointerStartY;
    if (pointerIntent === "pending" && Math.hypot(fromStartX, fromStartY) > 7) {
      if (Math.abs(fromStartX) > Math.abs(fromStartY) * 1.25) {
        pointerIntent = "drag";
        dragging = true;
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
      cancelAnimationFrame(dragFrame);
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
  data-weather={weather}
  data-quality={quality}
  data-pointer-intent={pointerIntent}
  data-yaw={yaw}
  data-pitch={pitch}
  data-cursor={dragging ? "drag" : "webgl"}
  onpointerdown={startDrag}
  onpointermove={moveDrag}
  onpointerup={stopDrag}
  onpointercancel={stopDrag}
>
  <span class="palette-probe foreground" bind:this={foregroundProbe}></span>
  <span class="palette-probe primary" bind:this={primaryProbe}></span>
  <span class="palette-probe accent" bind:this={accentProbe}></span>
  <div class="weather-fallback">
    <i class="clear"></i><i class="cloudy"></i><i class="rain"></i><i class="snow"></i>
  </div>
  <div class="canvas" bind:this={canvasHost}>
    {#if Scene && palette}<Scene {quality} {palette} {yaw} {pitch} weather={weather} />{/if}
  </div>
</div>

<style>
  .ambient {
    position: absolute;
    z-index: var(--z-content);
    inset: 0;
    overflow: hidden;
    color: var(--color-secondary);
    touch-action: pan-y;
  }

  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: min(200svh, 100%);
  }

  .weather-fallback {
    position: absolute;
    inset: -8%;
    pointer-events: none;
    opacity: 1;
    transition: opacity var(--motion-duration-base) var(--motion-ease-standard);
  }

  .weather-fallback i {
    position: absolute;
    inset: 0;
    display: block;
    opacity: 0;
    transition: opacity var(--motion-duration-base) var(--motion-ease-standard);
  }

  .weather-fallback .clear {
    background: radial-gradient(circle at 30% 22%, color-mix(in srgb, var(--color-accent) 34%, transparent), transparent 42%);
  }

  .weather-fallback .cloudy {
    background: radial-gradient(ellipse at center, color-mix(in srgb, var(--color-muted) 24%, transparent), transparent 64%);
    filter: blur(var(--glass-blur));
  }

  .weather-fallback .rain {
    background:
      radial-gradient(ellipse at 28% 24%, color-mix(in srgb, var(--color-secondary) 18%, transparent), transparent 34%),
      radial-gradient(ellipse at 72% 68%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 38%);
  }

  .weather-fallback .snow {
    background: radial-gradient(ellipse at center, color-mix(in srgb, var(--color-foreground) 12%, transparent), transparent 62%);
  }

  [data-weather="clear"] .weather-fallback .clear,
  [data-weather="cloudy"] .weather-fallback .cloudy,
  [data-weather="rain"] .weather-fallback .rain,
  [data-weather="snow"] .weather-fallback .snow { opacity: 0.3; }

  [data-webgl="true"] .weather-fallback { opacity: 0; }

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

  .canvas {
    right: 0;
  }

  @media (max-width: 52rem) {
    .ambient {
      opacity: 0.68;
    }
  }

  @media (max-width: 34rem) {
    .ambient {
      opacity: 0.56;
    }
  }

</style>
