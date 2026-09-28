<script lang="ts" module>
  export type ReferenceEntry = {
    author: string;
    title: string;
    /** Web サイトの名称。 */
    site: string;
    url: string;
    /** 参照日（YYYY-MM-DD）。 */
    accessed: string;
    /** 資料の言語。英語の資料は英語の書式で書く。 */
    lang?: "ja" | "en";
  };
</script>

<script lang="ts">
  import { DisclosureGlyph } from "@lunacea/ui/icons";

  /**
   * 記事末の参考文献。書式は情報処理学会論文誌の Web ページの形式に揃える。
   *   著者名：題名，サイト名（オンライン），入手先〈URL〉（参照日付）．
   *   Author: Title, Site (online), available from〈URL〉(accessed date).
   * 本文からは Cite が `#ref-番号` で指す。番号は items の順（引用順）。
   */
  let { items }: { items: ReferenceEntry[] } = $props();
</script>

<!--
  本文を読み終えた人が確かめるための一覧なので、既定では畳んで小さく置く。
  details なので JavaScript なしでも開閉できる。本文の番号から飛ぶと、アンカー移動が先に開く。
  見出しを押した開閉は他の折り畳みと同じく高さを伸ばして応える（rail-disclosure）。
  番号から飛んで開くときだけは動かさない。伸びている途中は行に位置がなく、ブラウザが行まで
  スクロールできないため。アンカー移動が data-instant を付けて開き、次の描画で外す。
  JavaScript がないとき（motion は off のまま）はブラウザが開くので、off では動き自体を持たない。
-->
<section class="references mt-16 font-interface" aria-label="参考文献">
  <details class="group rail-disclosure border-y border-rule [&[data-instant]::details-content]:transition-none motion-off:[&::details-content]:transition-none!">
    <summary class="flex min-h-control cursor-pointer list-none items-center justify-between gap-3 text-small leading-none font-component text-ink [&::-webkit-details-marker]:hidden">
      <span class="flex items-baseline gap-2">参考文献<span class="text-caption font-regular text-quiet tabular-nums">{items.length}</span></span>
      <DisclosureGlyph class="size-[1.1em] text-quiet" />
    </summary>
    <ol class="m-0! grid list-none gap-2 p-0 pb-3 text-caption leading-relaxed tracking-normal text-quiet">
      {#each items as item, index}
        <li
          id={`ref-${index + 1}`}
          class="m-0! grid scroll-mt-[calc(var(--article-anchor-offset)-var(--site-header-block))] grid-cols-[2.25em_minmax(0,1fr)] target:text-ink"
          lang={item.lang ?? "en"}
        >
          <span class="tabular-nums">[{index + 1}]</span>
          {#if (item.lang ?? "en") === "ja"}
            <span>{item.author}：{item.title}，{item.site}（オンライン），入手先〈<a class="[overflow-wrap:anywhere]" href={item.url}>{item.url}</a>〉（参照{item.accessed}）．</span>
          {:else}
            <span>{item.author}: {item.title}, {item.site} (online), available from〈<a class="[overflow-wrap:anywhere]" href={item.url}>{item.url}</a>〉(accessed {item.accessed}).</span>
          {/if}
        </li>
      {/each}
    </ol>
  </details>
</section>
