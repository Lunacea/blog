<script lang="ts" module>
  export type CalloutKind = "column" | "note" | "tip" | "warning";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { Icon, calloutIcons } from "@lunacea/ui/icons";
  import { cn } from "@lunacea/ui/utils";

  let {
    kind = "note",
    title,
    children,
  }: {
    kind?: CalloutKind;
    /** 本文の前に置く一行。なくてもよい。 */
    title?: string;
    children?: Snippet;
  } = $props();

  const labels: Record<CalloutKind, string> = {
    column: "コラム",
    note: "メモ",
    tip: "ヒント",
    warning: "注意",
  };
  const label = $derived(labels[kind]);
</script>

<!--
  本文の脇に置く囲み。h2 の帯と同じインクの地と右下だけ落とした角で、紙面の一部として読ませる。
  種類は図像と見出しの語で示し、色は増やさない。注意だけは左に罫を立てて重みを一段上げる。
  読み幅が画面に制限される幅では、h2 と同じく帯を左端まで伸ばす。
-->
<aside
  class={cn(
    "callout relative z-[calc(var(--z-controls)+1)] my-8 grid gap-2 rounded-(--radius-prose-heading) bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] px-5 pt-4 pb-5 font-interface max-[40.25rem]:-ml-(--layout-gutter) max-[40.25rem]:pl-(--layout-gutter) forced-colors:border forced-colors:border-[CanvasText]",
    kind === "warning" && "bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] shadow-[inset_3px_0_0_var(--color-ink)]",
  )}
  data-kind={kind}
  aria-label={title ? `${label}：${title}` : label}
>
  <span class="flex items-center gap-2 text-caption leading-none font-component tracking-ui text-ink">
    <Icon name={calloutIcons[kind]} class="size-[1.5em] shrink-0" />{label}
  </span>
  {#if title}
    <strong class="mt-1 block text-body leading-heading font-emphasis text-ink text-pretty">{title}</strong>
  {/if}
  {#if children}
    <div class="callout-content text-small leading-relaxed text-quiet">{@render children()}</div>
  {/if}
</aside>
