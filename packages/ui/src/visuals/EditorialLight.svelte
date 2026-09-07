<script lang="ts">
  import { onMount } from "svelte";
  import { subscribeMotionCapabilities } from "../motion/preferences.ts";
  import StaticLight from "./StaticLight.svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let { condition = "neutral" }: { condition?: WeatherVisualCondition } = $props();
  let host: HTMLDivElement;
  let enabled = $state(false);
  let updateCondition: ((condition: WeatherVisualCondition) => void) | undefined;
  $effect(() => { updateCondition?.(condition); });

  onMount(() => {
    let disposed = false;
    let failed = false;
    let visible = false;
    let generation = 0;
    let destroy: (() => void) | undefined;
    let resume: ((active: boolean) => void) | undefined;
    const eligible = () => document.documentElement.dataset.motion === "full" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !matchMedia("(forced-colors: active)").matches &&
      !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData &&
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) > 2 &&
      (navigator.hardwareConcurrency || 4) > 2;
    const stop = () => {
      generation++;
      destroy?.();
      destroy = undefined;
      resume = undefined;
      updateCondition = undefined;
      enabled = false;
    };
    const evaluate = async () => {
      if (disposed || failed) return;
      if (!eligible()) { stop(); return; }
      if (destroy) { resume?.(visible && !document.hidden); return; }
      if (!visible || document.hidden) return;
      const ticket = ++generation;
      try {
        const { mountEditorialLight } = await import("./editorial-light.ts");
        if (disposed || failed || ticket !== generation || !eligible() || !visible || document.hidden) return;
        const scene = mountEditorialLight(host, () => { failed = true; stop(); });
        destroy = scene.destroy;
        resume = scene.resume;
        updateCondition = scene.setCondition;
        scene.setCondition(condition);
        scene.resume(visible && !document.hidden);
        enabled = true;
      } catch {
        if (!disposed && ticket === generation) { failed = true; stop(); }
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      void evaluate();
    });
    observer.observe(host);
    const changed = () => { void evaluate(); };
    const stopCapabilities = subscribeMotionCapabilities(changed);
    window.addEventListener("lunacea:motion", changed);
    document.addEventListener("visibilitychange", changed);
    const idle = window.setTimeout(changed, 240);
    return () => {
      disposed = true;
      stop();
      clearTimeout(idle);
      observer.disconnect();
      stopCapabilities();
      window.removeEventListener("lunacea:motion", changed);
      document.removeEventListener("visibilitychange", changed);
    };
  });
</script>

<!--
  Home's field: the shared static light and grain, with an animated WebGL layer slotted
  between them once the device, the motion preference and the viewport all allow it.
-->
<StaticLight {condition} id="home" webgl={enabled}>
  {#snippet overlay()}
    <div
      class="absolute inset-0 opacity-0 transition-opacity duration-(--motion-duration-slow) ease-standard in-data-[webgl=true]:opacity-100 motion-off:transition-none"
      bind:this={host}
    ></div>
  {/snippet}
</StaticLight>
