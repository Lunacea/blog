<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import { responsiveImages } from "$lib/.generated/images.ts";
  import { createWeatherContext, loadFixedLocationWeather } from "$lib/weather-context.ts";
  import { ThemeToggle } from "$ui/components";
  import { ForwardGlyph } from "$ui/icons";
  import { HomeOpening } from "$ui/motion";
  import { IndexList, ProfileCard } from "$ui/patterns";
  import EditorialLight from "$ui/visuals/EditorialLight.svelte";
  import { parseWeatherVisualOverride } from "$ui/visuals/weather-visual.ts";
  import { siteConfig, visualAssets } from "@lunacea/config";

  let { data } = $props();
  const weather = createWeatherContext();
  const condition = $derived(
    (dev ? parseWeatherVisualOverride(page.url.searchParams.get("weather")) : null) ?? $weather.visual,
  );

  onMount(() => {
    const controller = new AbortController();
    void loadFixedLocationWeather(weather, controller.signal);
    return () => controller.abort();
  });

  /*
   * The mark is only ever drawn at the card's portrait size, so its variants are density steps
   * rather than widths, and the set is preloaded: the source PNG is half a megabyte and used to
   * arrive after the card had already animated in.
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
<EditorialLight {condition} />

<div class="relative">
  <!-- Home carries no bar of any kind: the masthead is the whole identity. -->
  <header class="relative flex justify-center overflow-x-clip pt-(--page-start-clearance)" aria-labelledby="home-title">
    <h1
      id="home-title"
      aria-label={siteConfig.name.toUpperCase()}
      class="my-0 flex w-max shrink-0 items-baseline whitespace-nowrap font-sans font-stretch-112% text-masthead leading-none font-strong tracking-masthead home-opening:animate-opening-resolve home-opening:[filter:url(#opening-ink)]"
    >
      <span aria-hidden="true">LUNA</span>
      <span class="relative inline-block"><span class="invisible" aria-hidden="true">C</span>
        <span class="absolute top-1/2 left-1/2 block size-(--masthead-disc-size) -translate-x-1/2 -translate-y-[calc(50%+var(--masthead-disc-rise))] home-opening:animate-disc-arrive">
          <ThemeToggle placement="masthead" />
        </span>
      </span>
      <span aria-hidden="true">EA</span>
    </h1>
  </header>

  <section id="about" class="mx-auto flex w-full max-w-content scroll-mt-(--space-16) justify-center px-(--layout-gutter) pt-(--space-16) pb-(--home-section-space)" aria-label="プロフィール">
    <ProfileCard
      class="max-w-(--profile-card-print) max-sm:max-w-[88%]"
      name={siteConfig.name}
      role="UI / UX Design — Web Engineering"
      bio={siteConfig.author.bio}
      {portrait}
      github={siteConfig.author.github}
      x={siteConfig.author.x}
      email={siteConfig.author.email}
    />
  </section>

  <section class="pb-(--home-section-space)" aria-labelledby="latest-heading">
    <h2 class="sr-only" id="latest-heading">最新の記事</h2>

    <nav class="mx-auto mb-(--space-8) flex w-full max-w-content flex-wrap items-baseline gap-x-(--space-8) gap-y-(--space-2) px-(--layout-gutter) home-opening:animate-opening-rise" aria-label="カテゴリ">
      {#each data.categories as category}
        <a class="group/category inline-flex min-h-control items-center font-stretch-88% text-h3 leading-none font-strong tracking-heading uppercase no-underline pressable [--press-scale:0.97] hover:no-underline" href={`/articles?${new URLSearchParams({ category })}`}>
          <span class="border-b-2 border-transparent pb-[.12em] transition-colors duration-(--motion-duration-fast) ease-standard group-hover/category:border-ink group-focus-visible/category:border-ink group-active/category:border-ink">{category}</span>
        </a>
      {/each}
    </nav>

    <!-- Rules run the full width of the window, the way the masthead does. -->
    <IndexList entries={data.latest} label="最新の記事" bleed />

    <div class="mx-auto mt-(--space-12) flex w-full max-w-content justify-center px-(--layout-gutter)">
      <!-- The fill retracts rather than the button moving, so the row below never shifts. -->
      <a class="group/all relative isolate inline-flex min-h-control items-center gap-x-(--space-4) overflow-hidden rounded-ui-card border border-ink px-(--space-8) py-(--space-4) font-stretch-88% text-small leading-none font-strong tracking-label text-canvas uppercase no-underline transition-colors duration-(--motion-duration-base) ease-standard before:absolute before:inset-0 before:-z-1 before:origin-bottom before:scale-y-100 before:bg-ink before:transition-[scale] before:duration-(--motion-duration-base) before:ease-spring hover:text-ink hover:no-underline hover:before:scale-y-0 focus-visible:text-ink focus-visible:before:scale-y-0 active:text-canvas active:before:scale-y-100 motion-off:transition-none motion-off:before:duration-(--motion-duration-immediate)" href="/articles">
        <span>All articles</span>
        <ForwardGlyph />
      </a>
    </div>
  </section>
</div>
