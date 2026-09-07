<script lang="ts">
  import { HeartGlyph } from "../icons/index.ts";

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

  /** The acknowledgement lives in the glyph itself: it squashes and settles like a drop. */
  let celebrating = $state(false);
  let played = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (celebrate <= played) return;
    played = celebrate;
    clearTimeout(timer);
    celebrating = true;
    timer = setTimeout(() => (celebrating = false), 900);
    return () => clearTimeout(timer);
  });
</script>

<section class="reactions grid justify-items-center gap-(--space-3)" aria-label="称賛" data-reveal>
  <p class="m-0 font-stretch-84% text-folio leading-none tracking-folio text-quiet uppercase">Enjoyed this?</p>
  <button
    class="praise group grid cursor-pointer place-items-center gap-(--space-2) border-0 bg-transparent p-(--space-2) text-quiet transition-colors duration-(--motion-duration-fast) ease-standard hover:not-disabled:text-ink focus-visible:not-disabled:text-ink aria-pressed:text-ink disabled:cursor-default disabled:opacity-60 motion-reduced:duration-(--motion-duration-immediate) motion-off:duration-(--motion-duration-immediate)"
    type="button"
    {disabled}
    aria-pressed={selected}
    aria-busy={pending}
    aria-label={selected ? "称賛を取り消す" : "称賛する"}
    data-celebrating={celebrating}
    onclick={ontoggle}
  >
    <span
      class="grid origin-bottom place-items-center motion-full:data-[celebrating=true]:animate-praise-liquid"
      data-celebrating={celebrating}
      data-praise-celebration={celebrating ? "" : undefined}
    >
      <HeartGlyph
        filled={selected}
        class="size-(--space-10) origin-bottom transition-[scale] duration-(--motion-duration-base) ease-spring group-hover:not-disabled:scale-110 group-focus-visible:not-disabled:scale-110 motion-reduced:transition-none motion-off:transition-none"
      />
    </span>
    <span class="count text-(length:--text-caption) leading-none tabular-nums">{count}</span>
  </button>
  <p class="status sr-only" aria-live="polite">{message}</p>
</section>
