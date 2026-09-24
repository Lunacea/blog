<script lang="ts">
  import { responsiveImages } from "$lib/.generated/images.ts";
  import PageHead from "$lib/PageHead.svelte";
  import ThemeToggle from "$lib/preferences/ThemeToggle.svelte";
  import HomeOpening from "$lib/home/HomeOpening.svelte";
  import LiquidTitle from "$lib/home/LiquidTitle.svelte";
  import IndexList from "$lib/articles/IndexList.svelte";
  import ProfileCard from "$lib/home/ProfileCard.svelte";
  import AllArticlesLink from "$lib/home/AllArticlesLink.svelte";
  import { siteConfig, visualAssets } from "@lunacea/config";

  let { data } = $props();

  /*
   * マークは常に名刺の枠の寸法で描かれるので、変種は幅ではなく解像度倍率。
   * 先読みしないとカードのアニメーション後に届く。
   */
  const markVariants =
    responsiveImages[visualAssets.profile.src as keyof typeof responsiveImages] ?? [];
  const density = (kind: "avif" | "webp") =>
    markVariants.map((variant, index) => `${variant[kind]} ${index + 1}x`).join(", ");
  const portrait = {
    ...visualAssets.profile,
    sources: [
      { srcset: density("avif"), type: "image/avif" as const },
      { srcset: density("webp"), type: "image/webp" as const },
    ].filter((source) => source.srcset.length > 0),
  };

  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, description: siteConfig.description },
      { "@type": "Person", name: siteConfig.author.name, url: siteConfig.url, sameAs: [siteConfig.author.github, siteConfig.author.x] },
    ],
  };
</script>

<PageHead title={siteConfig.title} description={siteConfig.description} path="/" />
<svelte:head>
  {#if portrait.sources.length}
    <link rel="preload" as="image" imagesrcset={density("avif")} type="image/avif" fetchpriority="high" />
  {/if}
  <script type="application/ld+json">{JSON.stringify(structured)}</script>
</svelte:head>
<HomeOpening />

<!--
  横方向のみクリップ。名刺が題字や記事一覧の上を通れるよう縦のはみ出しは残す。
  電話幅では横組みの題字を月ごと90°回して左端に立てる。writing-mode で縦に組むとブラウザごとに
  字の基準線が変わり月がずれるため、デスクトップと同じ組みをそのまま回す。上端ははみ出させ、下端は
  最後の A を記事一覧の罫で断ち切り、一覧の頭が最初の画面に覗くようにする。字面の左端は本文の左端に揃える。
  名刺は縮めずに題字の右へ重ね、右端からはみ出させる（ドラッグで引き出せる）。月には掛けない。
-->
<div class="relative overflow-x-clip max-xs:grid max-xs:grid-cols-[auto_minmax(0,1fr)]">
  <header class="relative flex justify-center overflow-x-clip pt-(--page-start-clearance) max-xs:col-start-1 max-xs:row-start-1 max-xs:block max-xs:h-(--masthead-upright-block) max-xs:w-(--masthead-upright-thickness) max-xs:overflow-x-visible max-xs:overflow-y-clip max-xs:pt-0" aria-labelledby="home-title">
    <!-- 月は動かさない。題字が着地する目印であり、同時にテーマ操作子でもあるため。 -->
    <h1
      id="home-title"
      aria-label={siteConfig.name.toUpperCase()}
      class="my-0 flex w-max shrink-0 items-baseline whitespace-nowrap font-sans font-stretch-112% text-masthead leading-none font-strong tracking-masthead home-opening:animate-opening-resolve home-opening:filter-[url(#opening-ink)] max-xs:absolute max-xs:top-0 max-xs:left-0 max-xs:origin-top-left max-xs:translate-x-(--masthead-upright-shift) max-xs:-translate-y-(--masthead-upright-bleed) max-xs:rotate-90 max-xs:text-masthead-upright"
    >
      <LiquidTitle text="LUNACEA" slotIndex={4}>
        {#snippet slot()}
          <span class="absolute top-1/2 left-1/2 block size-(--masthead-disc-size) -translate-x-1/2 -translate-y-[calc(50%+var(--masthead-disc-rise))] home-opening:animate-disc-arrive">
            <ThemeToggle placement="masthead" />
          </span>
        {/snippet}
      </LiquidTitle>
    </h1>
  </header>

  <section id="about" class="scroll-mt-(--space-16) pt-(--space-16) pb-(--home-section-space) max-xs:col-start-2 max-xs:row-start-1 max-xs:self-start max-xs:p-0 max-xs:pt-(--profile-card-upright-top)" aria-label="プロフィール">
    <div class="mx-auto flex w-full max-w-content justify-center px-(--layout-gutter) max-xs:justify-start max-xs:px-0">
      <ProfileCard
        class="max-w-(--profile-card-print) max-sm:w-[calc(100%_-_var(--space-4))] max-xs:-ml-(--profile-card-upright-overlap) max-xs:w-(--profile-card-upright) max-xs:max-w-none max-xs:shrink-0"
        name={siteConfig.name}
        role="UI / UX Design — Web Engineering"
        bio={siteConfig.author.bio}
        {portrait}
        github={siteConfig.author.github}
        x={siteConfig.author.x}
        email={siteConfig.author.email}
      />
    </div>
  </section>

  <section class="pb-(--home-section-space) max-xs:col-span-2" aria-labelledby="latest-heading">
    <h2 class="sr-only" id="latest-heading">最新の記事</h2>

    <IndexList entries={data.latest} label="最新の記事" bleed />

    <div class="mx-auto mt-(--space-12) flex w-full max-w-content justify-center px-(--layout-gutter)">
      <AllArticlesLink />
    </div>
  </section>
</div>
