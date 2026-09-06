<script lang="ts">
  import HomeSnapController from "$lib/components/HomeSnapController.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import ThemeToggle from "$ui/components/ThemeToggle.svelte";
  import { GlassProfileCard } from "$ui/patterns";
  import { Icon, ScrollGlyph, tagIconName } from "$ui/icons";
  import { MediaSlot } from "$ui/visuals";
  import AmbientHero from "$ui/visuals/AmbientHero.svelte";
  import { HomeOpening } from "$ui/motion";
  import { siteConfig, visualAssets } from "@lunacea/config";

  const authorLinks: Array<string | null> = [
    siteConfig.author.github as string | null,
    siteConfig.author.x as string | null,
  ];
  const sameAs = authorLinks.filter((value): value is string => value !== null);
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
      },
      {
        "@type": "Person",
        name: siteConfig.author.name,
        url: siteConfig.url,
        ...(sameAs.length ? { sameAs } : {}),
      },
    ],
  };
</script>

<PageHead
  title={siteConfig.title}
  description={siteConfig.description}
  path="/"
/>
<HomeOpening />
<HomeSnapController />
<svelte:head
  ><script type="application/ld+json">
{JSON.stringify(structured)}
  </script></svelte:head
>

<div class="home-continuum">
  <div class="visual-surface pointer-events-auto absolute inset-0 z-(--z-content) min-h-[200svh] home-opening:animate-home-visual-enter">
    <AmbientHero />
  </div>
  {#if visualAssets.heroOrganic.src}
    <div class="foliage pointer-events-none absolute -top-(--space-12) -right-(--space-8) z-[calc(var(--z-visual)+1)] w-[min(34vw,31rem)] origin-top-right motion-full:animate-foliage-grow max-md:-top-(--space-8) max-md:-right-(--space-10) max-md:w-[min(48vw,22rem)] [&_.media-slot]:overflow-visible [&_img]:origin-[86%_8%] motion-full:[&_img]:animate-foliage-breathe">
      <MediaSlot asset={visualAssets.heroOrganic} showPlaceholder={false} />
    </div>
  {/if}

  <section
    class="home-section intro pointer-events-none relative z-(--z-visual) grid min-h-svh snap-start snap-always grid-rows-[1fr_auto_1fr] items-start p-(--layout-gutter) *:pointer-events-auto"
    aria-labelledby="home-title"
    data-home-intro
  >
    <div class="title-block row-start-2 place-self-center text-center home-opening:animate-home-title-enter">
      <h1 class="m-0 font-serif text-display leading-display font-regular tracking-display" id="home-title" aria-label="Lunacea">
        <span aria-hidden="true">Luna</span><span class="title-glyph ms-[-.02em] me-[-.04em] inline-flex size-[.792em] items-center justify-center align-[.03em] text-(length:--text-title-glyph) text-signal [&_.theme-glyph]:size-full"
          ><ThemeToggle placement="title" /></span
        ><span aria-hidden="true">ea</span>
      </h1>
      <p class="mt-(--space-4) mb-0 text-small tracking-ui text-quiet">Quiet structures, durable records.</p>
    </div>
    <a class="about-link group row-start-3 flex h-(--control-size) items-center gap-(--space-3) place-self-end font-serif text-body text-quiet no-underline home-opening:animate-home-other-enter" href="#about">
      <ScrollGlyph /><span>View profile</span>
    </a>
  </section>

  <section
    id="about"
    class="home-section about pointer-events-none relative z-(--z-visual) grid min-h-svh snap-start snap-always scroll-mt-0 place-items-center px-(--layout-gutter) py-[max(var(--space-20),env(safe-area-inset-top),env(safe-area-inset-bottom))] *:pointer-events-auto"
    aria-label="About Lunacea"
    data-home-about
    data-profile-boundary
  >
    <div class="about-content grid w-[min(100%,var(--content-width))] justify-items-center gap-(--space-12) max-md:gap-(--space-10) **:data-[cursor=drag]:pointer-events-auto">
      <GlassProfileCard
        asset={visualAssets.profile}
        name={siteConfig.author.name}
        field="Web Engineering / Graphic Design"
        github={siteConfig.author.github}
        x={siteConfig.author.x}
        email={siteConfig.author.email}
      />
      <div class="grid justify-items-center gap-(--space-5)">
        <p class="about-introduction m-0 max-w-(--prose-width) px-(--space-4) py-(--space-3) text-center leading-copy text-ink max-xs:bg-transparent max-xs:px-0 max-xs:text-small max-h-[42rem]:bg-transparent max-h-[42rem]:px-0 max-h-[42rem]:text-small">
          UI・UX設計、Webエンジニアリング、<br />グラフィックデザイン。
        </p>
        <ul class="tech-stack m-0 flex list-none flex-wrap justify-center gap-x-(--space-5) gap-y-(--space-2) p-0 text-caption tracking-ui text-quiet" aria-label="主な技術スタック">
          {#each siteConfig.techStack as item}
            <li class="flex items-center gap-(--space-2) leading-none"><Icon name={tagIconName(item)} /><span>{item}</span></li>
          {/each}
        </ul>
        <a class="font-serif text-body underline decoration-rule underline-offset-8 hover:decoration-ink" href="/articles">記事を読む</a>
      </div>
    </div>
  </section>
</div>
