<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { cn } from "../utils.ts";

  let { class: className = "", children }: { class?: string; children: Snippet } = $props();

  /**
   * Oversized display type warped through a displacement map: the same wet-ink language as the
   * Home opening, run once on arrival and again whenever a pointer crosses it. The map rests at
   * scale zero, so between plays the filter passes the glyphs through untouched and there is no
   * decorative loop to stop.
   */
  let warp = $state<SVGAnimateElement | null>(null);
  let swell = $state<SVGAnimateElement | null>(null);
  let glyphs = $state<HTMLElement | null>(null);
  let allowed = $state(false);

  function play() {
    if (!allowed) return;
    warp?.beginElement();
    swell?.beginElement();
  }

  onMount(() => {
    const root = document.documentElement;
    // The pre-paint script already folds OS reduced motion and forced colours into this one
    // attribute, so the effect follows the reader's setting without asking twice.
    const sync = () => allowed = root.dataset.motion === "full";
    sync();
    play();
    globalThis.addEventListener("lunacea:motion", sync);
    // The listener is bound here rather than declared: the glyphs carry no meaning and no role,
    // and a hover flourish must not turn them into something a reader is told about.
    glyphs?.addEventListener("pointerenter", play);
    return () => {
      globalThis.removeEventListener("lunacea:motion", sync);
      glyphs?.removeEventListener("pointerenter", play);
    };
  });
</script>

<svg class="absolute size-0" aria-hidden="true" focusable="false">
  <filter
    id="liquid-distortion"
    x="-12%"
    y="-40%"
    width="124%"
    height="180%"
    color-interpolation-filters="sRGB"
  >
    <feTurbulence type="fractalNoise" baseFrequency=".006 .014" numOctaves="3" seed="11" result="warp">
      <animate
        bind:this={warp}
        attributeName="baseFrequency"
        begin="indefinite"
        dur="1.1s"
        fill="freeze"
        values=".006 .014;.013 .007;.008 .013;.006 .014"
      />
    </feTurbulence>
    <feDisplacementMap
      in="SourceGraphic"
      in2="warp"
      scale="0"
      xChannelSelector="R"
      yChannelSelector="G"
    >
      <animate
        bind:this={swell}
        attributeName="scale"
        begin="indefinite"
        dur="1.1s"
        fill="freeze"
        values="0;40;24;10;0"
        keyTimes="0;.18;.45;.72;1"
        calcMode="spline"
        keySplines=".2 0 .35 1;.2 0 .35 1;.2 0 .35 1;.2 0 .35 1"
      />
    </feDisplacementMap>
  </filter>
</svg>

<span
  bind:this={glyphs}
  class={cn("motion-full:filter-[url(#liquid-distortion)]", className)}
  data-liquid={allowed ? "active" : "static"}
>
  {@render children()}
</span>
