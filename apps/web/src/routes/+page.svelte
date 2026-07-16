<script lang="ts">
  import { siteConfig, visualAssets } from "@lunacea/config";
  import AmbientHero from "$ui/visuals/AmbientHero.svelte";
  import { MediaSlot } from "$ui/visuals";
  import PageHead from "$lib/components/PageHead.svelte";

  const portals = [
    { href: "/articles", label: "Articles", note: "Writing & research" },
    { href: "/works", label: "Works", note: "Selected practice" },
    { href: "/archive", label: "Archive", note: "Places & fragments" },
    { href: "#about", label: "About", note: "Profile & focus" },
  ];
</script>

<PageHead title={siteConfig.title} description={siteConfig.description} path="/" />

<div class="home-continuum">
  <AmbientHero />
<section class:sample={siteConfig.sampleMode} class="home-frame" data-home-opening>
  {#if visualAssets.heroOrganic.src}
    <MediaSlot asset={visualAssets.heroOrganic} class="organic-slot" />
  {/if}

  <div class="shell home-grid">
    <div class="context">
      <p class="eyebrow">Personal archive / Morioka</p>
      <p class="coordinates" aria-label="盛岡の座標">
        <span>39.7036 N</span><span>141.1527 E</span>
      </p>
    </div>

    <div class="hero-copy">
      <p class="index" aria-hidden="true">Archive / 001</p>
      <h1>Quiet structures,<br />growing records.</h1>
      <p class="statement">
        人のいなくなった近未来建築に、<br />
        コード、研究、写真、土地の記憶を残す。
      </p>
    </div>

    <nav class="portals" aria-label="ホームの主要コンテンツ">
      {#each portals as portal, index}
        <a href={portal.href}>
          <span class="number">{String(index + 1).padStart(2, "0")}</span>
          <strong>{portal.label}</strong>
          <span class="note">{portal.note}</span>
        </a>
      {/each}
    </nav>

  </div>
</section>

<section id="about" class="about shell" aria-labelledby="about-title">
  <header class="about-header" data-reveal>
    <p class="eyebrow">Profile / Sample</p>
    <h2 id="about-title" class="page-title">About</h2>
    <p class="lead">計算機と空間の間にあるインターフェースを研究し、長く読めるソフトウェアと記録の形を作ります。</p>
  </header>
  <div class="about-grid">
    <MediaSlot asset={visualAssets.profile} showPlaceholder={siteConfig.sampleMode} label="Portrait / replace" class="profile-slot" />
    <section class="about-statement" data-reveal>
      <p class="eyebrow">Statement</p>
      <h3>技術は、内容を隠すためではなく、残すために使う。</h3>
      <p>Svelte、Deno、可視化、アクセシビリティを中心に、情報構造と実装を往復しています。このページは交換可能なサンプルであり、公開前に実際のプロフィールへ差し替えます。</p>
    </section>
    <section class="focus" data-reveal>
      <p class="eyebrow">Focus</p>
      <dl>
        <div><dt>Research</dt><dd>Human–Computer Interaction / Visualization</dd></div>
        <div><dt>Engineering</dt><dd>TypeScript / SvelteKit / Deno</dd></div>
        <div><dt>Design</dt><dd>Information Architecture / Accessibility</dd></div>
        <div><dt>Location</dt><dd>Morioka, Iwate</dd></div>
      </dl>
    </section>
  </div>
</section>
</div>

<section class="contact shell" aria-labelledby="contact-title">
  <p class="eyebrow">Contact / Social</p>
  <h2 id="contact-title">Contact</h2>
  <ul>
    <li><span>GitHub</span>{#if siteConfig.author.github}<a href={siteConfig.author.github} rel="me">Open</a>{:else}<span>未設定</span>{/if}</li>
    <li><span>X</span>{#if siteConfig.author.x}<a href={siteConfig.author.x} rel="me">Open</a>{:else}<span>未設定</span>{/if}</li>
    <li><span>Email</span>{#if siteConfig.author.email}<a href={`mailto:${siteConfig.author.email}`}>Send</a>{:else}<span>未設定</span>{/if}</li>
  </ul>
</section>

<style>
  .home-frame {
    position: relative;
    height: calc(100dvh - var(--site-header-block));
    min-height: calc(100svh - var(--site-header-block));
    overflow: hidden;
    border-bottom: 1px solid var(--color-line);
  }

  .home-continuum { position: relative; overflow: clip; }
  .about { position: relative; z-index: var(--z-visual); }

  .about, .contact { scroll-margin-top: calc(var(--site-header-block) + var(--space-6)); padding-block: var(--section-space); }
  .about-header { display: grid; grid-template-columns: 1.2fr 1fr; margin-bottom: var(--section-space); }
  .about-header .eyebrow { grid-column: 1 / -1; }
  .about-header .lead { align-self: end; }
  .about-grid { display: grid; grid-template-columns: minmax(13rem, .65fr) minmax(18rem, 1.2fr) minmax(16rem, .85fr); align-items: start; gap: clamp(var(--space-8), 6vw, var(--space-20)); }
  :global(.profile-slot) { max-width: 22rem; }
  .about-statement h3 { max-width: 18ch; margin: 0 0 var(--space-8); font-family: var(--font-serif); font-size: var(--text-h2); font-weight: var(--weight-regular); line-height: var(--leading-profile); }
  .about-statement > p:last-child { max-width: 40rem; color: var(--color-muted); }
  dl, dl div { margin: 0; }
  dl div { border-top: 1px solid var(--color-line); padding-block: var(--space-4); }
  dt { color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-caption); }
  dd { margin: var(--space-1) 0 0; }
  .contact { border-top: 1px solid var(--color-line); }
  .contact h2 { margin: 0 0 var(--space-8); font-size: var(--text-h2); }
  .contact ul { margin: 0; padding: 0; list-style: none; }
  .contact li { display: grid; grid-template-columns: 1fr auto; border-top: 1px solid var(--color-line); padding-block: var(--space-3); }
  .contact li > span:last-child { color: var(--color-muted); }

  .home-frame.sample {
    height: calc(100dvh - var(--site-header-block) - var(--sample-banner-block));
    min-height: calc(100svh - var(--site-header-block) - var(--sample-banner-block));
  }

  .home-frame::before,
  .home-frame::after {
    position: absolute;
    z-index: var(--z-base);
    pointer-events: none;
    content: "";
  }

  .home-frame::before {
    top: 0;
    bottom: 0;
    left: 50%;
    border-left: 1px solid var(--color-line);
    opacity: 0.62;
  }

  .home-frame::after {
    top: 28%;
    right: 0;
    left: 0;
    border-top: 1px solid var(--color-line);
    opacity: 0.48;
  }

  .home-grid {
    position: relative;
    z-index: var(--z-visual);
    display: grid;
    height: 100%;
    grid-template-rows: auto minmax(0, 1fr) auto;
    padding-block: clamp(var(--space-5), 4vh, var(--space-10));
  }

  .context {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-8);
  }

  .coordinates {
    display: flex;
    gap: var(--space-4);
    margin: 0;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .hero-copy {
    align-self: center;
    padding-block: var(--space-5);
  }

  .index {
    margin: 0 0 var(--space-4);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  h1 {
    max-width: 12ch;
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-display);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-display);
    line-height: var(--leading-display);
    text-wrap: balance;
  }

  .statement {
    max-width: 31rem;
    /* design-literal: fluid hero indentation intentionally starts at zero. */
    margin: clamp(var(--space-5), 4vh, var(--space-10)) 0 0 clamp(0px, 7vw, var(--space-24));
    color: var(--color-muted);
    font-size: var(--text-body);
    line-height: var(--leading-hero-copy);
  }

  .portals {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 1px solid var(--color-line);
  }

  .portals a {
    display: grid;
    min-height: 5.5rem;
    grid-template-columns: auto 1fr;
    align-content: center;
    gap: 0 var(--space-3);
    border-right: 1px solid var(--color-line);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    transition:
      color var(--motion-duration-fast) var(--motion-ease-standard),
      background var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .portals a:first-child {
    border-left: 1px solid var(--color-line);
  }

  .portals a:hover,
  .portals a:focus-visible {
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-surface) 58%, transparent);
  }

  .number,
  .note {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .number {
    grid-row: 1 / 3;
  }

  .portals strong {
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
    line-height: var(--leading-snug);
  }

  .note {
    line-height: var(--leading-compact);
  }

  :global(.organic-slot) {
    position: absolute !important;
    z-index: var(--z-content);
    right: -3%;
    bottom: 0;
    width: min(28vw, 24rem) !important;
    pointer-events: none;
  }

  /* design-literal: compact landscape height is independent from width breakpoints. */
  @media (max-height: 48rem) and (min-width: 52rem) {
    .home-frame,
    .home-frame.sample {
      height: auto;
      min-height: calc(100svh - var(--site-header-block));
      overflow: clip;
    }

    .home-frame.sample {
      min-height: calc(100svh - var(--site-header-block) - var(--sample-banner-block));
    }

    .home-grid {
      min-height: inherit;
      gap: var(--space-4);
    }
  }

  @media (max-width: 52rem) {
    .home-frame,
    .home-frame.sample {
      height: auto;
      min-height: calc(100svh - var(--site-header-block));
      overflow: clip;
    }

    .home-frame.sample {
      min-height: calc(100svh - 9.5rem);
    }

    .home-frame::before {
      left: 62%;
    }

    .home-grid {
      min-height: inherit;
      grid-template-rows: auto 1fr auto;
      gap: var(--space-8);
      padding-block: var(--space-6) var(--space-20);
    }

    .hero-copy {
      align-self: end;
      padding-top: clamp(var(--space-12), 10vh, var(--space-20));
    }

    .statement {
      margin-left: 0;
    }

    .portals {
      grid-template-columns: 1fr 1fr;
    }

    .portals a:nth-child(2) {
      border-right: 1px solid var(--color-line);
    }

    .portals a:nth-child(n + 3) {
      border-top: 1px solid var(--color-line);
    }
    .about-grid { grid-template-columns: minmax(12rem, .7fr) 1.3fr; }
    .focus { grid-column: 2; }
  }

  @media (max-width: 34rem) {
    .about-header, .about-grid { grid-template-columns: 1fr; }
    .about-header .lead { margin-top: var(--space-8); }
    .focus { grid-column: 1; }
    :global(.profile-slot) { max-width: 100%; aspect-ratio: 4 / 3; }
    .coordinates {
      align-items: flex-end;
      flex-direction: column;
      gap: 0;
    }

    .portals a {
      min-height: 5rem;
      padding-inline: var(--space-3);
    }

    .note {
      display: none;
    }
  }
</style>
