<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { cn } from "../utils.ts";
  import { createLiquidSpring, liquid, liquidAllowed, verticalInk } from "./liquid.ts";

  /**
   * Display type that the cursor warps. The opening sets the wordmark down out of wet ink; from
   * then on the pointer draws a distortion out of it — along the letters' height only, and at a
   * fine grain, so the ink tears vertically inside a glyph rather than lifting the whole of it.
   *
   * The warp is a shape, not a motion. It stands where the cursor is, deepest under it and dying
   * away within a letter or two, and it moves because the cursor moves — nothing here oscillates,
   * so a pointer held still leaves the wordmark held still too, and the frame loop lets go. Taken
   * away, the ink carries a little past its rest and settles, which is the only inertia here.
   *
   * The letters are decoration over an accessible name the caller owns, and a letter at rest
   * carries no filter at all, so the server-rendered wordmark, forced colours and a reader with
   * motion off are all the plain type.
   */
  let {
    text,
    slotIndex = -1,
    class: className = "",
    slot,
  }: {
    text: string;
    /**
     * The letter whose glyph `slot` replaces. It keeps the letter's advance and is the one letter
     * the wave leaves alone: it is the mark the wordmark lands on, and on Home it is also the
     * control the pointer is aiming at, which must not warp out from under it.
     */
    slotIndex?: number;
    class?: string;
    slot?: Snippet;
  } = $props();

  const id = $props.id();
  const marked = $derived(slotIndex >= 0 && slot !== undefined);
  const glyphs = $derived(
    [...text].map((letter, index) => ({ letter, index, ink: `${id}-${index}` })),
  );

  let row = $state<HTMLElement | null>(null);
  /* Bound per letter, so they are state: a plain array would take the nodes but warn about it. */
  const cells = $state<(HTMLElement | null)[]>([]);
  const maps = $state<(SVGFEDisplacementMapElement | null)[]>([]);

  /* Where each letter's middle sits along the row, as a fraction of it, and the row's own box. */
  const centres: number[] = [];
  const wetted: boolean[] = [];
  let rowLeft = 0;
  let rowWidth = 0;

  /*
   * Damped harder than the shared spring: this one carries no oscillation of its own, so all the
   * ringing a reader would ever see is the single overshoot it makes on release. More than that
   * and a warp that is meant to answer the cursor starts to wobble on its own.
   */
  const spring = createLiquidSpring(40, 7.4);
  let frame = 0;
  let last = 0;
  let intent = 0;
  let touch = 0.5;
  let chased = 0.5;
  let settled = 0;
  let onscreen = false;

  function measure() {
    const box = row?.getBoundingClientRect();
    if (!box?.width) return;
    rowLeft = box.left;
    rowWidth = box.width;
    for (let index = 0; index < cells.length; index++) {
      const cellBox = cells[index]?.getBoundingClientRect();
      centres[index] = cellBox ? (cellBox.left + cellBox.width / 2 - box.left) / box.width : 0.5;
    }
  }

  /** A letter only carries a filter while it has something to warp. */
  function wet(index: number, value: boolean) {
    const cell = cells[index];
    if (!cell || wetted[index] === value) return;
    wetted[index] = value;
    cell.dataset.liquid = value ? "wet" : "dry";
  }

  function rest() {
    for (const { index } of glyphs) {
      maps[index]?.setAttribute("scale", "0");
      wet(index, false);
    }
  }

  function step(now: number) {
    const delta = Math.min(last ? (now - last) / 1000 : 0, 0.05);
    last = now;
    const envelope = spring.advance(intent, delta);
    // The warp follows the cursor rather than jumping to it, so dragging the pointer along the
    // word pulls the distortion with it instead of stepping it from letter to letter.
    const before = chased;
    chased += (touch - chased) * Math.min(1, delta * 15);
    for (const { index } of glyphs) {
      if (index === slotIndex) continue;
      // Distance from the pointer is the whole of it: deepest under the cursor, gone within a
      // letter or two, and never delayed — a delay is what turned this into a travelling wave.
      const distance = Math.abs((centres[index] ?? 0.5) - chased);
      const depth = envelope * Math.exp(-distance * liquid.falloff);
      if (Math.abs(depth) < liquid.still) {
        maps[index]?.setAttribute("scale", "0");
        wet(index, false);
        continue;
      }
      wet(index, true);
      maps[index]?.setAttribute("scale", (depth * verticalInk.scale).toFixed(2));
    }
    if (intent === 0 && !spring.moving) {
      frame = 0;
      spring.settle();
      rest();
      return;
    }
    /*
     * Nothing here oscillates, so once the ink has reached the shape the cursor asks for there is
     * no next frame worth drawing: the loop lets go and the warp simply stands there until the
     * pointer moves again. A few frames of grace keep a slow drag from starting and stopping.
     */
    const moved = Math.abs(chased - before) > 0.0002 ||
      Math.abs(envelope - intent) > liquid.still * 0.5;
    settled = moved ? 0 : settled + 1;
    if (settled > 4) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(step);
  }

  function start() {
    if (frame || !onscreen || !liquidAllowed()) return;
    if (!rowWidth) measure();
    last = 0;
    settled = 0;
    frame = requestAnimationFrame(step);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    intent = 0;
    settled = 0;
    chased = touch;
    spring.settle();
    rest();
  }

  function track(event: PointerEvent) {
    // A wave answers a pointer hovering the type; a finger is dragging the page past it.
    if (event.pointerType === "touch" || !rowWidth || !onscreen || !liquidAllowed()) return;
    touch = (event.clientX - rowLeft) / rowWidth;
    intent = 1;
    start();
  }

  function release() {
    intent = 0;
    // The loop lets go while the pointer rests on the word, so the settling has to wake it.
    start();
  }

  onMount(() => {
    measure();
    // The listeners are bound here rather than declared: the letters carry no meaning and no
    // role, and a pointer flourish must not turn them into something a reader is told about.
    row?.addEventListener("pointermove", track, { passive: true });
    row?.addEventListener("pointerleave", release);
    // Glyph advances are only final once the real face has loaded, and the row is wider than the
    // window, so the letters' positions have to be taken again afterwards.
    void document.fonts?.ready.then(measure).catch(() => {});
    const observer = new ResizeObserver(measure);
    if (row) observer.observe(row);
    const watcher = new IntersectionObserver(([entry]) => {
      onscreen = Boolean(entry?.isIntersecting);
      if (!onscreen) stop();
    });
    if (row) watcher.observe(row);
    const changed = () => {
      if (!liquidAllowed()) stop();
    };
    addEventListener("lunacea:motion", changed);
    document.addEventListener("visibilitychange", changed);
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      row?.removeEventListener("pointermove", track);
      row?.removeEventListener("pointerleave", release);
      observer.disconnect();
      watcher.disconnect();
      removeEventListener("lunacea:motion", changed);
      document.removeEventListener("visibilitychange", changed);
    };
  });
</script>

<!--
  One map per letter, all sampling one turbulence. The noise is generated in user space, so the
  letters read a single continuous sheet of ink rather than each getting its own pattern, and only
  the maps the wave has reached are given a scale to displace by. Red is the horizontal term: held
  flat at its midpoint it displaces nothing, so the ink can only ever move along the letter.
-->
<svg class="absolute size-0" aria-hidden="true" focusable="false">
  {#each glyphs as glyph (glyph.index)}
    {#if glyph.index !== slotIndex}
      <filter
        id={glyph.ink}
        x={verticalInk.x}
        y={verticalInk.y}
        width={verticalInk.width}
        height={verticalInk.height}
        color-interpolation-filters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency={verticalInk.baseFrequency}
          numOctaves={verticalInk.octaves}
          seed={verticalInk.seed}
          result="noise"
        />
        <feComponentTransfer in="noise" result="warp">
          <feFuncR type="table" tableValues="0.5 0.5" />
        </feComponentTransfer>
        <feDisplacementMap
          bind:this={maps[glyph.index]}
          in="SourceGraphic"
          in2="warp"
          scale="0"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    {/if}
  {/each}
</svg>

<span bind:this={row} class={cn("inline-flex items-baseline whitespace-nowrap", className)}>
  {#each glyphs as glyph (glyph.index)}
    {#if glyph.index === slotIndex && marked}
      <span class="relative inline-block"
        ><span class="invisible" aria-hidden="true" bind:this={cells[glyph.index]}>{glyph.letter}</span
        >{@render slot?.()}</span
      >
    {:else}
      <span
        class="inline-block motion-full:data-[liquid=wet]:filter-(--liquid-ink) forced-colors:filter-none print:filter-none"
        style={`--liquid-ink:url(#${glyph.ink})`}
        data-liquid="dry"
        aria-hidden="true"
        bind:this={cells[glyph.index]}>{glyph.letter}</span
      >
    {/if}
  {/each}
</span>
