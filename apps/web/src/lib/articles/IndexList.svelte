<script lang="ts">
  import { cn } from "@lunacea/ui/utils";
  import type { IndexEntry } from "./index-entry.ts";

  let {
    entries,
    label,
    bleed = false,
  }: {
    entries: readonly IndexEntry[];
    label: string;
    /** 罫線は画面幅いっぱい、内容はグリッド上に留める。`"compact"` はレール未満の幅のみ。 */
    bleed?: boolean | "compact";
  } = $props();

  const rules = $derived(bleed === "compact" ? "max-md:-mx-(--layout-gutter)" : "");
  // ガラスの縁の抜き方はホバーの見え方であって配置の都合ではないので、bleed にも幅にもよらず同じにする。
  const paneFade =
    "mask-[linear-gradient(to_right,transparent_0%,black_20%,black_80%,transparent_100%)]";
  const inner = $derived(
    bleed === true
      ? "mx-auto w-full max-w-content px-(--layout-gutter)"
      : bleed === "compact"
        ? "w-full max-md:px-(--layout-gutter)"
        : "w-full",
  );
</script>

<ol class={cn("index-list m-0 grid list-none border-t border-ink p-0", rules)} aria-label={label}>
  {#each entries as entry (entry.slug)}
    <li
      class="group relative isolate border-b border-rule before:absolute before:inset-x-0 before:-bottom-px before:h-0.5 before:bg-ink before:opacity-0 before:transition-opacity before:duration-(--motion-duration-base) before:ease-signature hover:before:opacity-100 focus-within:before:opacity-100 active:before:opacity-100 motion-off:before:duration-(--motion-duration-immediate)"
    >
      <!-- 読んでいる行の下のすりガラス。文字には触れず、左右に罫線も足さない。 -->
      <span
        class={cn("pointer-events-none absolute inset-0 -z-1 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface)_34%,transparent),color-mix(in_srgb,var(--color-surface)_14%,transparent))] border-t border-t-[color-mix(in_srgb,var(--color-light-source)_34%,transparent)] backdrop-blur-[18px] backdrop-saturate-150 opacity-0 transition-opacity duration-(--motion-duration-base) ease-signature group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 motion-off:duration-(--motion-duration-immediate) forced-colors:hidden print:hidden", paneFade)}
        aria-hidden="true"
      ></span>
      <div class={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-(--space-4) md:items-baseline gap-y-(--space-3) py-(--index-row-space) md:grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_minmax(0,7rem)] md:gap-x-(--space-6)",
        inner,
      )}>
        <span class="col-span-2 col-start-1 row-start-1 truncate font-stretch-84% text-folio leading-none tracking-folio text-ink uppercase sm:col-span-1 md:col-start-3 md:text-right md:text-quiet">{entry.category ?? ""}</span>

        <time class="col-start-2 row-start-1 hidden text-right font-stretch-84% text-folio leading-none tracking-folio text-quiet tabular-nums sm:block md:col-start-1 md:text-left" datetime={entry.publishedAt}>{entry.publishedAt.replaceAll("-", ".")}</time>

        <div class="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
          <h3 class="m-0 text-index leading-tight font-strong tracking-heading text-balance">
            <!-- 登録済みカスタムプロパティの変更は color: inherit を確実に無効化しないため色を明示する。 -->
            <a class="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:no-underline" href={entry.href}>{entry.title}</a>
          </h3>

          <time class="mt-(--space-3) block font-stretch-84% text-folio leading-none tracking-folio text-quiet tabular-nums sm:hidden" datetime={entry.publishedAt}>{entry.publishedAt.replaceAll("-", ".")}</time>

          {#if entry.summary}
            <div class="index-summary hidden grid-rows-[1fr] transition-[grid-template-rows] duration-(--motion-duration-base) ease-signature sm:grid md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus-within:grid-rows-[1fr] motion-off:duration-(--motion-duration-immediate)">
              <div class="overflow-hidden">
                <!-- 本文より一段広い測り。全角でおよそ44字、2行で言い切れる長さに収まる。 -->
                <p class="mt-(--space-3) mb-0 max-w-[44em] text-small leading-copy text-quiet">{entry.summary}</p>
              </div>
            </div>
          {/if}

          {#if entry.tags?.length}
            <p class="mt-(--space-3) mb-0 flex flex-wrap gap-x-(--space-3) gap-y-(--space-1) text-small leading-none text-quiet">
              {#each entry.tags.slice(0, 4) as tag}<span>#{tag}</span>{/each}
            </p>
          {/if}
        </div>

      </div>
    </li>
  {/each}
</ol>
