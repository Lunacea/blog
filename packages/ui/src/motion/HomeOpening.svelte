<script lang="ts">
  import { onMount } from "svelte";

  /**
   * フィルタはサーバ描画に含める。初回描画の時点で参照が解決し、
   * ハイドレーション後に再生し直すのではなくページと一緒に動く。
   */
  let running = $state(true);

  onMount(() => {
    const root = document.documentElement;
    // オープニングはドキュメント読み込み時のみ。アプリ内遷移では再生しない。
    if (root.dataset.motion !== "full" || root.dataset.homeOpening !== "active") {
      running = false;
      return;
    }
    const finish = () => {
      delete root.dataset.homeOpening;
      running = false;
    };
    const timer = window.setTimeout(finish, 1450);
    const changed = () => { if (root.dataset.motion !== "full") finish(); };
    window.addEventListener("lunacea:motion", changed);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("lunacea:motion", changed);
      finish();
    };
  });
</script>

<!-- 変位は強い歪みから0まで走り、その後フィルタごと外すのでセッション中の負荷は残らない。 -->
{#if running}
  <svg class="absolute size-0" aria-hidden="true" focusable="false">
    <filter id="opening-ink" x="-14%" y="-45%" width="128%" height="190%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".004 .011" numOctaves="3" seed="7" result="warp">
        <animate attributeName="baseFrequency" dur="1.25s" fill="freeze"
          values=".004 .011;.009 .006;.006 .01;.005 .012" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="46" xChannelSelector="R" yChannelSelector="G">
        <animate attributeName="scale" dur="1.25s" fill="freeze"
          values="46;31;16;5;0" keyTimes="0;.3;.56;.8;1" calcMode="spline"
          keySplines=".2 0 .35 1;.2 0 .35 1;.2 0 .35 1;.2 0 .35 1" />
      </feDisplacementMap>
    </filter>
  </svg>
{/if}
