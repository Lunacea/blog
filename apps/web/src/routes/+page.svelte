<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { siteConfig, visualAssets } from "@lunacea/config";
  import ThemeToggle from "$ui/components/ThemeToggle.svelte";
  import { EngineeringProfile, GlassProfileCard } from "$ui/patterns";
  import type { ApprovedIconName } from "$ui/icons";
  import AmbientHero from "$ui/visuals/AmbientHero.svelte";
  import { parseWeatherVisualOverride } from "$ui/visuals";
  import { getWeatherContext } from "$lib/weather-context.ts";
  import PageHead from "$lib/components/PageHead.svelte";
  import HomeSnapController from "$lib/components/HomeSnapController.svelte";

  const weather = getWeatherContext();
  const devWeather = $derived(
    dev ? parseWeatherVisualOverride(page.url.searchParams.get("weather")) : null,
  );
  const engineeringCategories: readonly {
    title: string;
    technologies: readonly { label: string; icon: ApprovedIconName }[];
  }[] = [
    {
      title: "Frontend",
      technologies: [
        { label: "SvelteKit / Svelte 5", icon: "simple-icons:svelte" },
        { label: "Tailwind CSS 4", icon: "simple-icons:tailwindcss" },
        { label: "Threlte", icon: "solar:code-linear" },
        { label: "Three.js", icon: "simple-icons:threedotjs" },
      ],
    },
    {
      title: "Backend",
      technologies: [
        { label: "Deno 2", icon: "simple-icons:deno" },
        { label: "Hono", icon: "solar:code-linear" },
        { label: "Zod", icon: "simple-icons:zod" },
      ],
    },
    {
      title: "Database",
      technologies: [{ label: "Deno KV", icon: "simple-icons:deno" }],
    },
    {
      title: "Infrastructure / Hosting",
      technologies: [{ label: "Deno Deploy", icon: "simple-icons:deno" }],
    },
    {
      title: "Development Tools",
      technologies: [
        { label: "TypeScript", icon: "simple-icons:typescript" },
        { label: "Vite", icon: "simple-icons:vite" },
      ],
    },
    {
      title: "Design / Creative Tools",
      technologies: [
        { label: "Storybook", icon: "simple-icons:storybook" },
        { label: "Sharp", icon: "simple-icons:sharp" },
      ],
    },
    {
      title: "Testing / Quality",
      technologies: [
        { label: "Deno Test", icon: "simple-icons:deno" },
        { label: "Vitest", icon: "simple-icons:vitest" },
        { label: "Playwright", icon: "simple-icons:playwright" },
        { label: "axe-core", icon: "solar:accessibility-linear" },
      ],
    },
  ];
  const authorLinks: Array<string | null> = [
    siteConfig.author.github as string | null,
    siteConfig.author.x as string | null,
  ];
  const sameAs = authorLinks.filter((value): value is string => value !== null);
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, description: siteConfig.description },
      { "@type": "Person", name: siteConfig.author.name, url: siteConfig.url, ...(sameAs.length ? { sameAs } : {}) },
    ],
  };
</script>

<PageHead title={siteConfig.title} description={siteConfig.description} path="/" />
<HomeSnapController />
<svelte:head><script type="application/ld+json">{JSON.stringify(structured)}</script></svelte:head>

<div class="home-continuum">
  <div class="visual-surface"><AmbientHero weather={devWeather ?? $weather.visual} /></div>

  <section class="home-section intro" aria-labelledby="home-title" data-home-opening>
    <p class="intro-copy">
      コード、研究、写真、土地の記憶を、<br />静かに読み継げる形へ。
    </p>
    <div class="title-block">
      <h1 id="home-title" aria-label="Lunacea">
        <span aria-hidden="true">Luna</span><span class="title-glyph"><ThemeToggle placement="title" /></span><span aria-hidden="true">ea</span>
      </h1>
      <p>Quiet structures, durable records.</p>
    </div>
    <a class="about-link" href="#about">プロフィールを見る</a>
  </section>

  <section
    id="about"
    class="home-section about"
    aria-label="About Lunacea"
    data-home-about
    data-profile-boundary
  >
    <div class="about-content">
      <GlassProfileCard
        asset={visualAssets.profile}
        name={siteConfig.author.name}
        field="Interactive Systems / Design Research"
        github={siteConfig.author.github}
        x={siteConfig.author.x}
        email={siteConfig.author.email}
      />
      <p class="about-introduction">
        計算機と空間の間にあるインターフェースを研究し、長く読めるソフトウェアと記録の形を作ります。
      </p>
      <EngineeringProfile categories={engineeringCategories} />
    </div>
  </section>
</div>

<style>
  .home-continuum {
    position: relative;
    min-height: 200svh;
    overflow: clip;
  }

  :global(html:has(.home-continuum)) {
    scroll-snap-type: y mandatory;
  }

  .visual-surface {
    position: absolute;
    z-index: var(--z-content);
    inset: 0;
    min-height: 200svh;
    pointer-events: auto;
  }

  .home-section {
    position: relative;
    z-index: var(--z-visual);
    min-height: 100svh;
    padding: var(--layout-gutter);
    scroll-snap-align: start;
    scroll-snap-stop: always;
    pointer-events: none;
  }

  .home-section > * {
    pointer-events: auto;
  }

  .intro {
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    align-items: start;
  }

  .intro-copy {
    max-width: 25rem;
    margin: env(safe-area-inset-top) 0 0;
    color: var(--color-muted);
    line-height: var(--leading-copy);
  }

  .title-block {
    align-self: center;
    justify-self: center;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-display);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-display);
    line-height: var(--leading-display);
  }

  .title-glyph {
    display: inline-flex;
    width: .792em;
    height: .792em;
    margin-inline: -.02em -.04em;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
    font-size: var(--text-title-glyph);
    vertical-align: .03em;
  }

  .title-glyph :global(.theme-glyph) {
    width: 100%;
    height: 100%;
  }

  .title-block p {
    margin: var(--space-4) 0 0;
    color: var(--color-muted);
    font-size: var(--text-small);
    letter-spacing: var(--tracking-ui);
  }

  .about-link {
    align-self: end;
    justify-self: end;
    min-height: var(--control-size);
    color: var(--color-muted);
    font-size: var(--text-small);
    text-decoration: none;
  }

  .about {
    display: grid;
    place-items: start center;
    padding-block: calc(var(--space-20) + env(safe-area-inset-top))
      calc(var(--space-16) + env(safe-area-inset-bottom));
    scroll-margin-top: 0;
  }

  .about-content {
    display: grid;
    width: min(100%, var(--content-width));
    justify-items: center;
    gap: var(--space-12);
  }

  .about :global(.profile-card) {
    pointer-events: auto;
  }

  .about-introduction {
    max-width: var(--prose-width);
    margin: 0;
    padding: var(--space-3) var(--space-4);
    background: color-mix(in srgb, var(--color-background) 72%, transparent);
    color: var(--color-foreground);
    line-height: var(--leading-copy);
    text-align: center;
  }

  @media (max-width: 52rem) {
    .home-section {
      padding-inline: var(--layout-gutter);
    }

    .about-content {
      gap: var(--space-10);
    }

  }

  @media (max-width: 34rem), (max-height: 42rem) {
    .intro-copy {
      font-size: var(--text-small);
    }

    .about {
      padding-block: calc(var(--space-16) + env(safe-area-inset-top))
        calc(var(--space-12) + env(safe-area-inset-bottom));
    }

    .about-introduction {
      padding-inline: 0;
      background: transparent;
      font-size: var(--text-small);
    }

  }
</style>
