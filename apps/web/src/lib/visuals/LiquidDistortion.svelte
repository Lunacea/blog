<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { cn } from "@lunacea/ui/utils";
  import { createLiquidSpring, liquid, liquidAllowed, liquidWave, openingInk } from "./liquid.ts";

  let { class: className = "", children }: { class?: string; children: Snippet } = $props();

  /**
   * オープニングと同じ変位マップで歪ませる特大の見出し。静止時はマップの scale が 0 で
   * フィルタ自体を外すため、装飾の常時ループは存在しない。
   */
  const id = $props.id();
  let glyphs = $state<HTMLElement | null>(null);
  let map = $state<SVGFEDisplacementMapElement | null>(null);

  const spring = createLiquidSpring();
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let intent = 0;
  let wet = false;
  let onscreen = false;

  function rest() {
    map?.setAttribute("scale", "0");
    if (!wet || !glyphs) return;
    wet = false;
    glyphs.dataset.liquid = "dry";
  }

  function step(now: number) {
    const delta = Math.min(last ? (now - last) / 1000 : 0, 0.05);
    last = now;
    elapsed += delta;
    const envelope = spring.advance(intent, delta);
    if (!wet && glyphs) {
      wet = true;
      glyphs.dataset.liquid = "wet";
    }
    map?.setAttribute(
      "scale",
      (liquidWave(elapsed * liquid.speed) * envelope * liquid.scale).toFixed(2),
    );
    if (intent === 0 && !spring.moving) {
      frame = 0;
      spring.settle();
      rest();
      return;
    }
    frame = requestAnimationFrame(step);
  }

  function start() {
    if (frame || !onscreen || !liquidAllowed()) return;
    last = 0;
    frame = requestAnimationFrame(step);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    intent = 0;
    spring.settle();
    rest();
  }

  function hold(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    intent = 1;
    start();
  }

  function release() {
    intent = 0;
  }

  onMount(() => {
    // 装飾でしかないため、宣言せずここで束ねて支援技術に露出させない。
    glyphs?.addEventListener("pointerenter", hold);
    glyphs?.addEventListener("pointerleave", release);
    const watcher = new IntersectionObserver(([entry]) => {
      onscreen = Boolean(entry?.isIntersecting);
      if (!onscreen) stop();
        else if (!frame && liquidAllowed()) {
        spring.kick(5.5);
        start();
      }
    });
    if (glyphs) watcher.observe(glyphs);
    const changed = () => {
      if (!liquidAllowed()) stop();
    };
    globalThis.addEventListener("lunacea:motion", changed);
    document.addEventListener("visibilitychange", changed);
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      glyphs?.removeEventListener("pointerenter", hold);
      glyphs?.removeEventListener("pointerleave", release);
      watcher.disconnect();
      globalThis.removeEventListener("lunacea:motion", changed);
      document.removeEventListener("visibilitychange", changed);
    };
  });
</script>

<svg class="absolute size-0" aria-hidden="true" focusable="false">
  <filter
    id={`${id}-ink`}
    x={openingInk.x}
    y={openingInk.y}
    width={openingInk.width}
    height={openingInk.height}
    color-interpolation-filters="sRGB"
  >
    <feTurbulence
      type="fractalNoise"
      baseFrequency={openingInk.baseFrequency}
      numOctaves={openingInk.octaves}
      seed={openingInk.seed}
      result="warp"
    />
    <feDisplacementMap bind:this={map} in="SourceGraphic" in2="warp" scale="0" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>

<span
  bind:this={glyphs}
  class={cn(
    "motion-full:data-[liquid=wet]:filter-(--liquid-ink) forced-colors:filter-none print:filter-none",
    className,
  )}
  style={`--liquid-ink:url(#${id}-ink)`}
  data-liquid="dry"
>
  {@render children()}
</span>
