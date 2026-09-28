<script lang="ts">
  /* 同じページに複数置かれるので、グラデーションとマスクの id は実体ごとに分ける。 */
  const uid = $props.id();
</script>

<!--
  太陽と月は同じ1枚の円。月は円を欠けの円で抜いた形で、テーマが変わると欠けが軌道を描いて
  滑り込み（蝕）、戻ると同じ軌道を引き返す。入れ替えではなく、その場で形が変わって見える。
  欠けは円の中心を軸に回しながら外から近づける。回転と平行移動を一つの transform に並べて
  補間するので、まっすぐではなく弧を描いて入る。色は形と同じ長さで溶かして移す。
  欠けの寸法は元の月の字形（半径 6.8 の円を右上 4.402 ずらした円で抜く）を円の半径に合わせたもの。
-->
<span class="theme-glyph relative inline-block size-[1em] shrink-0 align-[-.08em] [&_svg]:absolute [&_svg]:inset-0 [&_svg]:block [&_svg]:size-full [&_svg]:overflow-hidden" aria-hidden="true">
  <svg viewBox="0 0 13.276 13.276">
    <defs>
      <linearGradient id={`${uid}-sun`} x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0" stop-color="currentColor" />
        <stop offset="1" stop-color="var(--color-sun-ember)" />
      </linearGradient>
      <linearGradient id={`${uid}-moon`} x1="1" y1="0" x2="0.15" y2="1">
        <stop offset="0" stop-color="var(--color-moon-glow)" />
        <stop offset="1" stop-color="currentColor" />
      </linearGradient>
      <mask id={`${uid}-bite`} maskUnits="userSpaceOnUse" x="-2" y="-2" width="17.276" height="17.276">
        <rect x="-2" y="-2" width="17.276" height="17.276" fill="white" />
        <circle
          class="bite [transform-box:view-box] origin-[6.638px_6.638px] [transform:rotate(-70deg)_translate(5.5px,-5.5px)] transition-transform duration-(--motion-duration-base) ease-signature theme-dark:[transform:rotate(0deg)_translate(0px,0px)]"
          cx="10.935"
          cy="2.341"
          r="6.638"
          fill="black"
        />
      </mask>
    </defs>
    <g mask={`url(#${uid}-bite)`}>
      <circle cx="6.638" cy="6.638" r="6.638" fill={`url(#${uid}-sun)`} />
      <circle
        class="opacity-0 transition-opacity duration-(--motion-duration-base) ease-signature theme-dark:opacity-100"
        cx="6.638"
        cy="6.638"
        r="6.638"
        fill={`url(#${uid}-moon)`}
      />
    </g>
  </svg>
</span>
