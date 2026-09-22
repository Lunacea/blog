<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { cn } from "../utils.ts";
  import { createLiquidSpring, liquid, liquidAllowed, verticalInk } from "./liquid.ts";

  /**
   * カーソルが歪ませる見出し。歪みは運動ではなく形で、カーソル位置が最も深く1〜2文字で消える。
   * 振動しないのでポインタを止めればフレームループも止まる。
   *
   * 文字は呼び出し側が持つアクセシブルネームの上の装飾で、静止時はフィルタを持たない。
   */
  let {
    text,
    slotIndex = -1,
    class: className = "",
    slot,
  }: {
    text: string;
    /**
     * `slot` が字形を差し替える文字。字送りは保ったまま、この文字だけは歪ませない
     * （ホームではこれ自体がポインタの狙う操作子であるため）。
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
  /* 文字ごとに bind するため state にする。素の配列でも動くが警告が出る。 */
  const cells = $state<(HTMLElement | null)[]>([]);
  const maps = $state<(SVGFEDisplacementMapElement | null)[]>([]);

  const centres: number[] = [];
  const wetted: boolean[] = [];
  let rowLeft = 0;
  let rowWidth = 0;

  /*
   * 共通のバネより強く減衰させる。見えるのは解放時の行き過ぎ1回だけ。
   * これ以上だとカーソルへの応答であるはずの歪みが自励振動に見える。
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

  /** 歪ませるものがある間だけフィルタを付ける。 */
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
    const before = chased;
    chased += (touch - chased) * Math.min(1, delta * 15);
    for (const { index } of glyphs) {
      if (index === slotIndex) continue;
      // 距離だけで決める。遅延を入れると進行波になってしまう。
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
     * 振動しないので、カーソルが要求する形に達したら描くべき次フレームはない。
     * 数フレームの猶予は、ゆっくりしたドラッグで停止と再開を繰り返さないため。
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
    // 波はホバーへの応答。タッチはページを動かしている操作なので反応しない。
    if (event.pointerType === "touch" || !rowWidth || !onscreen || !liquidAllowed()) return;
    touch = (event.clientX - rowLeft) / rowWidth;
    intent = 1;
    start();
  }

  function release() {
    intent = 0;
    // ポインタが止まるとループが停止するため、収束時に起こし直す。
    start();
  }

  onMount(() => {
    measure();
    // 装飾でしかないため、宣言せずここで束ねて支援技術に露出させない。
    row?.addEventListener("pointermove", track, { passive: true });
    row?.addEventListener("pointerleave", release);
    // 実フォント読み込み後に字送りが確定するため、位置を測り直す。
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
  文字ごとに1つのマップが同一の turbulence を参照する。ノイズはユーザ空間で生成するため、
  文字ごとに別の模様にならず1枚の連続したインクとして読める。
  赤チャンネルが水平成分。中央値で固定すると変位しないので、インクは縦にしか動かない。
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
        class={cn(
          "inline-block motion-full:data-[liquid=wet]:filter-(--liquid-ink) forced-colors:filter-none print:filter-none",
          marked && glyph.index === slotIndex + 1 && "relative z-(--z-content)",
        )}
        style={`--liquid-ink:url(#${glyph.ink})`}
        data-liquid="dry"
        aria-hidden="true"
        bind:this={cells[glyph.index]}>{glyph.letter}</span
      >
    {/if}
  {/each}
</span>
