<script lang="ts">
  /**
   * 本文中の引用番号。関連する箇所の右肩に [番号] を置き、記事末の References の行を指す。
   * 行送りを乱さないよう、上付きは vertical-align ではなく位置の持ち上げで表す。
   */
  let { n }: { n: number } = $props();
</script>

<sup class="relative top-[-0.55em] align-baseline font-interface text-[0.7em] leading-none tracking-normal"><a
    class="cite-link text-quiet no-underline transition-colors duration-(--motion-duration-base) ease-signature hover:text-ink focus-visible:text-ink"
    href={`#ref-${n}`}
    aria-label={`参考文献${n}`}>[{n}]</a></sup>
