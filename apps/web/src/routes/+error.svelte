<script lang="ts">
  import { page } from "$app/state";
  import { HeaderSearch } from "$ui/components";
  import { LiquidDistortion } from "$ui/motion";
  import { actionVariants } from "$ui/primitives";
  import { siteConfig } from "@lunacea/config";

  const missing = $derived(page.status === 404);
  const caption = $derived(missing ? "Page is not found." : "Something went wrong.");
  const heading = $derived(missing ? "このページはありません" : "ページを開けませんでした");
  const detail = $derived(
    missing
      ? "アドレスが変わったか、記事が取り下げられたのかもしれません。打ち間違いでなければ、下から目的の記事を探せます。"
      : "一時的な不調が起きています。少し待ってから、もう一度開いてみてください。",
  );
</script>

<svelte:head><title>{heading} — {siteConfig.name}</title></svelte:head>

<div class="relative">
  <!-- Home sets its identity in one oversized line and centres what follows; this page keeps that
       composition. The status is decoration: the caption and heading below say it in words. -->
  <header
    class="relative flex justify-center overflow-x-clip pt-(--page-start-clearance)"
    aria-hidden="true"
  >
    <LiquidDistortion
      class="w-max shrink-0 whitespace-nowrap font-sans font-stretch-112% text-masthead leading-none font-strong tracking-masthead"
    >{page.status}</LiquidDistortion>
  </header>

  <section
    class="mx-auto flex w-full max-w-content flex-col items-center px-(--layout-gutter) pt-(--space-4) pb-(--home-section-space) text-center"
  >
    <!-- The English line belongs to the numerals above it, so it is set at label scale rather
         than as a caption, and the Japanese heading stays the loudest thing in the column. -->
    <p
      class="m-0 font-stretch-96% text-h2 leading-none font-strong"
    >{caption}</p>
    <h1
      class="m-0 mt-(--space-2) max-w-[24ch] font-stretch-96% text-h2 leading-heading font-strong tracking-heading text-balance"
    >{heading}</h1>
    <p class="lead text-balance">{detail}</p>

    <nav class="mt-(--space-12) flex flex-wrap justify-center gap-(--space-3)" aria-label="行き先">
      <a class={actionVariants("default")} href="/">ホームへ</a>
      <a class={actionVariants("outline")} href="/articles">記事の一覧へ</a>
    </nav>

    <h2 class="sr-only">記事を検索</h2>
    <!-- A plain GET to the catalog, so the way out works before any script arrives. -->
    <div class="mt-(--space-10) flex w-full justify-center">
      <HeaderSearch variant="static" />
    </div>
  </section>
</div>
