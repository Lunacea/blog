<script lang="ts">
  import { HeartGlyph } from "@lunacea/ui/icons";

  let {
    count,
    selected,
    pending = false,
    disabled = false,
    message = "",
    /** 称賛したときだけ増える。再訪で再生されることはない。 */
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

<!--
  本文を読み終えた場所に置く問いかけ。上に短い罫を引いて本文と区切り、問いは節見出しと同じ
  書体と重さで大きく立てる。ハートはその答えとして真下に置く。
-->
<section class="reactions grid w-full justify-items-center gap-(--space-2) text-center" aria-label="称賛">
  <span class="mb-(--space-4) block w-(--space-16) border-t border-ink" aria-hidden="true"></span>
  <p class="m-0 font-interface font-stretch-88% text-(length:--text-h3) leading-none font-strong text-ink">Enjoyed this?</p>
  <p class="m-0 mb-(--space-2) text-small leading-ui text-quiet">よければハートで知らせてください</p>
  <button
    class="praise group grid cursor-pointer place-items-center gap-(--space-2) border-0 bg-transparent p-(--space-2) text-(--color-praise) pressable [--press-scale:0.95] disabled:cursor-default disabled:opacity-60 motion-off:duration-(--motion-duration-immediate)"
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
    >
      <HeartGlyph
        filled={selected}
        class="size-(--space-10) origin-bottom transition-[scale] duration-(--motion-duration-base) ease-spring group-hover:not-disabled:scale-110 group-focus-visible:not-disabled:scale-110 group-active:not-disabled:scale-90 motion-off:transition-none"
      />
    </span>
    <span class="count text-(length:--text-caption) leading-none tabular-nums">{count}</span>
  </button>
  <p class="status sr-only" aria-live="polite">{message}</p>
</section>
