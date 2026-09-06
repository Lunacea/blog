<script lang="ts">
  import { HeartGlyph } from "../icons/index.ts";
  import ThankYouMark from "../visuals/ThankYouMark.svelte";

  let {
    count,
    selected,
    pending = false,
    disabled = false,
    message = "",
    /** Increments only when the reader praises the article, so a revisit never replays it. */
    celebrate = 0,
    ontoggle,
  }: {
    count: number;
    selected: boolean;
    pending?: boolean;
    disabled?: boolean;
    message?: string;
    celebrate?: number;
    ontoggle: () => void;
  } = $props();

  const fillDuration = 900;
  const holdDuration = 260;

  let control = $state<HTMLButtonElement | null>(null);
  /** 0 idle, 1 the heart floods the viewport, 2 a heart-shaped opening gives the page back. */
  let stage = $state(0);
  let originX = $state(0);
  let originY = $state(0);
  let played = 0;
  let timers: Array<ReturnType<typeof setTimeout>> = [];

  function clearTimers() {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  }

  $effect(() => {
    if (celebrate <= played) return;
    played = celebrate;
    const box = control?.getBoundingClientRect();
    originX = box ? box.left + box.width / 2 : globalThis.innerWidth / 2;
    originY = box ? box.top + box.height / 2 : globalThis.innerHeight / 2;
    clearTimers();
    stage = 1;
    timers = [
      setTimeout(() => (stage = 2), fillDuration + holdDuration),
      setTimeout(() => (stage = 0), fillDuration + holdDuration + 1100),
    ];
    return clearTimers;
  });
</script>

<section class="reactions grid justify-items-center gap-(--space-2)" aria-label="称賛" data-reveal>
  <button
    class="praise group grid cursor-pointer place-items-center gap-(--space-1) border-0 bg-transparent p-(--space-2) text-quiet transition-[color,scale] duration-(--motion-duration-fast) ease-standard hover:not-disabled:text-signal focus-visible:not-disabled:text-signal active:not-disabled:scale-95 aria-pressed:text-signal disabled:cursor-default disabled:opacity-60 motion-full:hover:not-disabled:[&_.heart-glyph]:scale-110 motion-full:focus-visible:not-disabled:[&_.heart-glyph]:scale-110 motion-reduced:duration-(--motion-duration-immediate) motion-off:duration-(--motion-duration-immediate)"
    type="button"
    bind:this={control}
    {disabled}
    aria-pressed={selected}
    aria-busy={pending}
    aria-label={selected ? "称賛を取り消す" : "称賛する"}
    data-celebrating={stage > 0}
    onclick={ontoggle}
  >
    <HeartGlyph
      filled={selected}
      class="size-(--space-12) transition-transform duration-(--motion-duration-fast) ease-enter motion-reduced:transition-none motion-off:transition-none"
    />
    <span class="count text-(length:--text-caption) leading-none tabular-nums">{count}</span>
  </button>
  <p class="status sr-only" aria-live="polite">{message}</p>
</section>

{#if stage > 0}
  <div
    class="praise-celebration pointer-events-none fixed inset-0 z-(--z-overlay) hidden place-items-center overflow-hidden motion-full:grid forced-colors:hidden!"
    style={`--bloom-x:${originX}px;--bloom-y:${originY}px`}
    aria-hidden="true"
    data-praise-celebration
    data-stage={stage}
  >
    {#if stage === 1}
      <HeartGlyph
        filled
        class="heart-bloom absolute top-(--bloom-y) left-(--bloom-x) size-[420vmax] max-w-none -translate-x-1/2 -translate-y-1/2 text-signal animate-praise-bloom"
      />
    {:else}
      <svg class="heart-clear absolute inset-0 size-full max-w-none" aria-hidden="true" focusable="false">
        <defs>
          <mask id="praise-clearing" maskUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="white" />
            <g class="clearing translate-x-(--bloom-x) translate-y-(--bloom-y) animate-praise-clear">
              <path
                d="M0 8.2C0 8.2 -8.4 2.6 -8.4 -2.8C-8.4 -5.6 -6.2 -7.6 -3.8 -7.6C-2.1 -7.6 -0.7 -6.6 0 -5.2C0.7 -6.6 2.1 -7.6 3.8 -7.6C6.2 -7.6 8.4 -5.6 8.4 -2.8C8.4 2.6 0 8.2 0 8.2Z"
                fill="black"
              />
            </g>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="var(--color-accent)" mask="url(#praise-clearing)" />
      </svg>
    {/if}
    <ThankYouMark />
  </div>
{/if}
