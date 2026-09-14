<script lang="ts">
  import ForwardGlyph from "../icons/ForwardGlyph.svelte";
  import { cn } from "../utils.ts";

  let { class: className = "" }: { class?: string } = $props();
</script>

<!--
  ボタン自体は動かさず塗りを引かせる。矢印側は字面に余白があるため右 padding を短くする。
  字間は中央から外へ開くので、塗りも横へ開く。上下に退くと動きの向きが噛み合わない。
  インクを左右の半分に分け、それぞれ外側へ引き抜く。
-->
<a
  class={cn(
    "group/all relative isolate inline-flex min-h-control items-center gap-x-(--space-3) overflow-hidden rounded-ui-card border border-ink py-(--space-4) pl-(--space-8) pr-(--space-6) font-stretch-88% text-small leading-none font-strong tracking-label text-canvas uppercase no-underline transition-[letter-spacing] duration-(--motion-duration-base) ease-signature pressable [--press-scale:0.97] hover:tracking-[0.2em] focus-visible:tracking-[0.2em] motion-off:transition-none before:absolute before:inset-y-0 before:left-0 before:-z-1 before:w-[calc(50%+1px)] before:bg-ink before:transition-[translate] before:duration-(--motion-duration-base) before:ease-signature after:absolute after:inset-y-0 after:right-0 after:-z-1 after:w-[calc(50%+1px)] after:bg-ink after:transition-[translate] after:duration-(--motion-duration-base) after:ease-signature hover:text-ink hover:no-underline hover:before:-translate-x-full hover:after:translate-x-full focus-visible:text-ink focus-visible:before:-translate-x-full focus-visible:after:translate-x-full active:text-ink active:before:-translate-x-full active:after:translate-x-full motion-off:before:duration-(--motion-duration-immediate) motion-off:after:duration-(--motion-duration-immediate)",
    className,
  )}
  href="/articles"
>
  <span>All articles</span>
  <ForwardGlyph />
</a>
