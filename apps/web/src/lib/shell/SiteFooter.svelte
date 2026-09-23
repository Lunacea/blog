<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Icon, socialIcons } from "@lunacea/ui/icons";
  import { createLiquidSpring } from "$lib/visuals/liquid.ts";
  import { subscribeMotionCapabilities } from "$lib/preferences/preferences.ts";

  let {
    name,
    email,
    github,
    x,
    startYear,
    theme,
    display,
  }: {
    name: string;
    email: string;
    github?: string;
    x?: string;
    /** サイトの開始年。事前描画ルートでは範囲の終端はビルド時に確定する。 */
    startYear: number;
    theme?: Snippet;
    display?: Snippet;
  } = $props();

  const year = new Date().getFullYear();
  const span = $derived(year > startYear ? `${startYear}–${year}` : `${startYear}`);
  /**
   * `baseFrequency` のアニメーションは毎フレーム ノイズを作り直すため、
   * モーションが有効かつフッタが画面内にあるときだけ動かす。
   */
  let allowed = $state(false);
  let visible = $state(false);
  const animated = $derived(allowed && visible);
  let field = $state<SVGSVGElement | null>(null);

  /**
   * アドレス上のポインタ位置（割合）。その位置のレンズ内だけが歪み、ノイズもその分ずれる。
   * ポインタが離れてもレンズは留まり、インクはその場でバネ的に収束する。
   */
  let touchX = $state(0.5);
  let touchY = $state(0.5);
  let wet = $state(0);
  let disturbed = $state(false);
  const spring = createLiquidSpring();
  let intent = 0;
  let frame = 0;
  let last = 0;
  const warpX = $derived(Math.round((touchX - 0.5) * 260));
  const warpY = $derived(Math.round((touchY - 0.5) * 90));
  const warpScale = $derived(7 + Math.round(wet * (4 + Math.abs(touchX - 0.5) * 12)));
  /*
   * レンズは在るか無いかの二値。残りの運動量でフェードさせると収束の間ずっと
   * インクの色と太さが変わり、文字がちらついて見える。慣性を持つのは形だけ。
   */
  const lens = $derived(
    `--touch-x:${(touchX * 100).toFixed(2)}%;--touch-y:${(touchY * 100).toFixed(2)}%;` +
      `--footer-wet:${disturbed ? 1 : 0}`,
  );

  function step(now: number) {
    const delta = Math.min(last ? (now - last) / 1000 : 0, 0.05);
    last = now;
    // バネの符号付き位置がインクを変位させる。レンズ自体はバネに乗せない。
    wet = spring.advance(intent, delta);
    if (intent === 0 && !spring.moving) {
      frame = 0;
      spring.settle();
      wet = 0;
      disturbed = false;
      return;
    }
    frame = requestAnimationFrame(step);
  }

  function run() {
    if (frame || document.documentElement.dataset.motion !== "full") return;
    disturbed = true;
    last = 0;
    frame = requestAnimationFrame(step);
  }

  let address = $state<HTMLElement | null>(null);

  function track(event: PointerEvent) {
    if (!address || document.documentElement.dataset.motion !== "full") return;
    const box = address.getBoundingClientRect();
    if (!box.width || !box.height) return;
    touchX = (event.clientX - box.left) / box.width;
    touchY = (event.clientY - box.top) / box.height;
    intent = 1;
    run();
  }

  function release() {
    intent = 0;
    run();
  }

  onMount(() => {
    const read = () => (allowed = document.documentElement.dataset.motion === "full");
    read();
    // 歪んだ複製が上に重なるため、宣言ではなくノードに直接束ねる。
    address?.addEventListener("pointermove", track, { passive: true });
    address?.addEventListener("pointerleave", release);
    address?.addEventListener("blur", release);
    const stopCapabilities = subscribeMotionCapabilities(read);
    addEventListener("lunacea:motion", read);
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    if (field) observer.observe(field);
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      address?.removeEventListener("pointermove", track);
      address?.removeEventListener("pointerleave", release);
      address?.removeEventListener("blur", release);
      stopCapabilities();
      removeEventListener("lunacea:motion", read);
      observer.disconnect();
    };
  });

  const links = $derived([
    github ? { label: "GitHub", href: github, icon: socialIcons.github, rel: "me" } : null,
    x ? { label: "X", href: x, icon: socialIcons.x, rel: "me" } : null,
  ].filter((entry) => entry !== null));
</script>

<!--
  歪ませた複製をポインタ追従の小さなレンズでマスクし、下の元の複製をその分くり抜くことで
  二重ではなく変位として見せる。実テキスト上の純粋な装飾で、アクセシブルネーム・リンク・
  キーボード経路には触れない。モーション無効・強制配色・印刷では外れる。
-->
<svg class="absolute size-0" aria-hidden="true" focusable="false">
  <filter id="footer-ink" x="-18%" y="-45%" width="136%" height="190%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".015 .029" numOctaves="2" seed="5" result="noise">
      {#if animated}
        <animate attributeName="baseFrequency" dur="14s" repeatCount="indefinite"
          values=".015 .029;.019 .023;.013 .032;.015 .029" />
      {/if}
    </feTurbulence>
    <feOffset in="noise" dx={warpX} dy={warpY} result="warp" />
    <feDisplacementMap in="SourceGraphic" in2="warp" scale={warpScale} xChannelSelector="R" yChannelSelector="G" />
  </filter>
  <filter id="footer-spray">
    <feTurbulence type="fractalNoise" baseFrequency=".86" numOctaves="4" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
  </filter>
  <filter id="footer-liquid" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".0035 .0055" numOctaves="4" seed="9" result="base">
      {#if animated}
        <animate attributeName="baseFrequency" dur="26s" repeatCount="indefinite"
          values=".0035 .0055;.0042 .0071;.0031 .0049;.0035 .0055" />
      {/if}
    </feTurbulence>
    <feTurbulence type="fractalNoise" baseFrequency=".021" numOctaves="2" seed="4" result="warp" />
    <feDisplacementMap in="base" in2="warp" scale="44" xChannelSelector="R" yChannelSelector="G" result="liquid">
      {#if animated}
        <animate attributeName="scale" dur="19s" repeatCount="indefinite" values="44;62;36;44" />
      {/if}
    </feDisplacementMap>
    <feColorMatrix in="liquid" type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.34" />
  </filter>
</svg>

<footer class="relative isolate z-(--z-content) overflow-hidden border-t border-rule">
  <svg class="pointer-events-none absolute inset-0 -z-1 size-full forced-colors:hidden print:hidden" aria-hidden="true" focusable="false" bind:this={field}>
    <defs>
      <linearGradient id="footer-glow" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="var(--color-light-source)" stop-opacity=".42" />
        <stop offset=".5" stop-color="var(--color-light-source)" stop-opacity=".16" />
        <stop offset="1" stop-color="var(--color-light-source)" stop-opacity=".38" />
      </linearGradient>
    </defs>
    <rect class="opacity-[.035] theme-dark:opacity-[.06]" width="100%" height="100%" fill="var(--color-shadow-body)" />
    <rect class="opacity-[.08] mix-blend-multiply theme-dark:opacity-[.36] theme-dark:mix-blend-screen" width="100%" height="100%" filter="url(#footer-liquid)" />
    <rect class="opacity-(--home-light-opacity) motion-reduced:opacity-0 motion-off:opacity-0" width="100%" height="100%" fill="url(#footer-glow)" />
    <rect class="opacity-[.07] mix-blend-multiply theme-dark:opacity-[.13] theme-dark:mix-blend-screen" width="100%" height="100%" filter="url(#footer-spray)" />
  </svg>

  <div class="mx-auto w-full max-w-content px-(--layout-gutter) py-(--space-16)">
    <div class="grid justify-items-center gap-y-(--space-2) py-(--space-4) text-center">
      <a
        class="group/mail relative m-0 grid min-h-control max-w-full content-center text-h2 leading-tight font-strong tracking-heading wrap-anywhere no-underline pressable [--footer-wet:0] [--press-scale:0.99] hover:no-underline"
        href={`mailto:${email}`}
        style={lens}
        data-liquid={disturbed ? "wet" : "dry"}
        bind:this={address}
      >
        <span class="col-start-1 row-start-1 group-data-[liquid=wet]/mail:mask-[radial-gradient(circle_var(--footer-lens)_at_var(--touch-x)_var(--touch-y),transparent_0%,transparent_44%,currentColor_86%)] group-focus-visible/mail:mask-[radial-gradient(circle_var(--footer-lens)_at_var(--touch-x)_var(--touch-y),transparent_0%,transparent_44%,currentColor_86%)] motion-off:group-data-[liquid=wet]/mail:mask-none motion-off:group-focus-visible/mail:mask-none forced-colors:group-data-[liquid=wet]/mail:mask-none print:group-data-[liquid=wet]/mail:mask-none">{email}</span>
        <span class="col-start-1 row-start-1 opacity-(--footer-wet) filter-[url(#footer-ink)] transition-opacity duration-(--motion-duration-base) ease-standard motion-off:transition-none mask-[radial-gradient(circle_var(--footer-lens)_at_var(--touch-x)_var(--touch-y),currentColor_0%,currentColor_52%,transparent_92%)] group-focus-visible/mail:[--footer-wet:1] motion-off:hidden forced-colors:hidden print:hidden" aria-hidden="true">{email}</span>
      </a>
      {#if links.length}
        <nav class="flex items-center gap-x-(--space-5)" aria-label="ソーシャルリンク">
          {#each links as link}
            <a
              class="inline-grid size-control place-items-center text-h3 text-ink no-underline transition-[translate,scale] duration-(--motion-duration-fast) ease-spring hover:-translate-y-0.5 hover:no-underline focus-visible:-translate-y-0.5 active:translate-y-px active:scale-90 motion-off:transition-none [&_svg]:size-(--space-5)"
              href={link.href}
              rel={link.rel}
              aria-label={link.label}
            >
              <Icon name={link.icon} />
            </a>
          {/each}
        </nav>
      {/if}
    </div>

    <div class="mt-(--space-12) flex flex-wrap items-center justify-between gap-x-(--space-6) gap-y-(--space-3) border-t border-rule pt-(--space-4)">
      <p class="m-0 font-stretch-74% text-folio leading-none tracking-folio text-quiet uppercase tabular-nums">&copy; {span} {name}.</p>
      <div class="flex items-center gap-x-(--space-1)">
        {#if theme}<div class="footer-theme">{@render theme()}</div>{/if}
        {#if display}<div class="footer-display">{@render display()}</div>{/if}
      </div>
    </div>
  </div>
</footer>
