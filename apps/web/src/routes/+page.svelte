<script lang="ts">
  import { page } from "$app/state";
  import { responsiveImages } from "$lib/.generated/images.ts";
  import PageHead from "$lib/components/PageHead.svelte";
  import { useFixedLocationWeather } from "$lib/weather.ts";
  import { ThemeToggle } from "$ui/components";
  import { HomeOpening, LiquidTitle } from "$ui/motion";
  import { IndexList, ProfileCard } from "$ui/patterns";
  import { AllArticlesLink } from "$ui/components";
  import { siteConfig, visualAssets } from "@lunacea/config";

  let { data } = $props();
  const weather = useFixedLocationWeather();

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

<!-- 横方向のみクリップ。名刺が題字や記事一覧の上を通れるよう縦のはみ出しは残す。 -->
<div class="relative overflow-x-clip">
  <header class="relative flex justify-center overflow-x-clip pt-(--page-start-clearance)" aria-labelledby="home-title">
    <!-- 月は動かさない。題字が着地する目印であり、同時にテーマ操作子でもあるため。 -->
    <h1
      id="home-title"
      aria-label={siteConfig.name.toUpperCase()}
      class="my-0 flex w-max shrink-0 items-baseline whitespace-nowrap font-sans font-stretch-112% text-masthead leading-none font-strong tracking-masthead home-opening:animate-opening-resolve home-opening:filter-[url(#opening-ink)]"
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

  <section id="about" class="scroll-mt-(--space-16) pt-(--space-16) pb-(--home-section-space)" aria-label="プロフィール">
    <div class="mx-auto flex w-full max-w-content justify-center px-(--layout-gutter)">
      <ProfileCard
        class="max-w-(--profile-card-print)"
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

  <section class="pb-(--home-section-space)" aria-labelledby="latest-heading">
    <h2 class="sr-only" id="latest-heading">最新の記事</h2>

    <IndexList entries={data.latest} label="最新の記事" bleed />

    <div class="mx-auto mt-(--space-12) flex w-full max-w-content justify-center px-(--layout-gutter)">
      <AllArticlesLink />
    </div>
  </section>
</div>
