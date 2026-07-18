<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import HomeSnapController from "$lib/components/HomeSnapController.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  import { getWeatherContext } from "$lib/weather-context.ts";
  import ThemeToggle from "$ui/components/ThemeToggle.svelte";
  import type { ApprovedIconName } from "$ui/icons";
  import { EngineeringProfile, GlassProfileCard } from "$ui/patterns";
  import { MediaSlot, parseWeatherVisualOverride } from "$ui/visuals";
  import AmbientHero from "$ui/visuals/AmbientHero.svelte";
  import { siteConfig, visualAssets } from "@lunacea/config";

  const weather = getWeatherContext();
  const devWeather = $derived(
    dev
      ? parseWeatherVisualOverride(page.url.searchParams.get("weather"))
      : null,
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
<HomeSnapController />
<svelte:head
  ><script type="application/ld+json">
{JSON.stringify(structured)}
  </script></svelte:head
>

<div class="home-continuum">
  <div class="visual-surface">
    <AmbientHero weather={devWeather ?? $weather.visual} />
  </div>
  {#if visualAssets.heroOrganic.src}
    <div class="foliage">
      <MediaSlot asset={visualAssets.heroOrganic} showPlaceholder={false} />
    </div>
  {/if}

  <section
    class="home-section intro"
    aria-labelledby="home-title"
    data-home-intro
  >
    <p class="intro-copy">Web Developer</p>
    <div class="title-block">
      <h1 id="home-title" aria-label="Lunacea">
        <span aria-hidden="true">Luna</span><span class="title-glyph"
          ><ThemeToggle placement="title" /></span
        ><span aria-hidden="true">ea</span>
      </h1>
      <p>Quiet structures, durable records.</p>
    </div>
    <a class="about-link" href="#about">
      <i aria-hidden="true"></i><span>View profile</span>
    </a>
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
        Cold Logic, Warm UX.<br />
        静かで、確かな、インタラクティブな体験を。
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

  .foliage {
    position: absolute;
    z-index: calc(var(--z-visual) + 1);
    top: calc(var(--space-12) * -1);
    right: calc(var(--space-8) * -1);
    width: min(34vw, 31rem);
    pointer-events: none;
    transform-origin: 100% 0;
  }

  .foliage :global(.media-slot) {
    overflow: visible;
  }

  :global(html[data-motion="full"]) .foliage {
    animation: foliage-grow var(--motion-duration-opening) var(--motion-ease-enter) both;
  }

  :global(html[data-motion="full"]) .foliage :global(img) {
    animation: foliage-breathe calc(var(--motion-duration-ambient) * 1.5)
      var(--motion-ease-standard) infinite alternate;
    transform-origin: 86% 8%;
  }

  @keyframes foliage-grow {
    from {
      opacity: 0;
      transform: scale(.72) rotate(4deg);
    }
  }

  @keyframes foliage-breathe {
    to {
      transform: rotate(-1.2deg) scale(1.012);
    }
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
    font-family: var(--font-serif);
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
    width: 0.792em;
    height: 0.792em;
    margin-inline: -0.02em -0.04em;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
    font-size: var(--text-title-glyph);
    vertical-align: 0.03em;
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
    display: flex;
    align-items: center;
    gap: var(--space-3);
    align-self: end;
    justify-self: end;
    min-height: var(--control-size);
    color: var(--color-muted);
    font-family: var(--font-serif);
    font-size: var(--text-body);
    text-decoration: none;
  }

  .about-link i {
    position: relative;
    width: 2px;
    height: var(--space-10);
    overflow: hidden;
    background: var(--color-line);
  }

  .about-link i::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 45%;
    background: currentColor;
    content: "";
  }

  :global(html[data-motion="full"]) .about-link i::after {
    animation: scroll-indicator var(--motion-duration-resume) var(--motion-ease-standard) infinite;
  }

  @keyframes scroll-indicator {
    from { transform: translateY(-110%); }
    to { transform: translateY(240%); }
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

    .foliage {
      top: calc(var(--space-8) * -1);
      right: calc(var(--space-10) * -1);
      width: min(48vw, 22rem);
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
