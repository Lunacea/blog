<script lang="ts">
  import { siteConfig, visualAssets } from "@lunacea/config";
  import { MediaSlot } from "$ui/visuals";
  import PageHead from "$lib/components/PageHead.svelte";
</script>

<PageHead
  title={`About — ${siteConfig.name}`}
  description="Lunaceaの研究、エンジニアリング、情報設計について。"
  path="/about"
/>

<div class="page shell">
  <header class="about-header" data-reveal>
    <p class="eyebrow">Profile / Sample</p>
    <h1 class="page-title">About</h1>
    <p class="lead">
      計算機と空間の間にあるインターフェースを研究し、長く読めるソフトウェアと記録の形を作ります。
    </p>
  </header>

  <div class="about-grid">
    <MediaSlot
      asset={visualAssets.profile}
      showPlaceholder={siteConfig.sampleMode}
      label="Portrait / replace"
      class="profile-slot"
    />

    <section class="statement" data-reveal>
      <p class="eyebrow">Statement</p>
      <h2>技術は、内容を隠すためではなく、残すために使う。</h2>
      <p>
        Svelte、Deno、可視化、アクセシビリティを中心に、情報構造と実装を往復しています。
        このページは交換可能なサンプルであり、公開前に実際のプロフィールへ差し替えます。
      </p>
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
</div>

<style>
  .about-header {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    margin-bottom: var(--section-space);
  }

  .about-header .eyebrow {
    grid-column: 1 / -1;
  }

  .about-header .lead {
    align-self: end;
  }

  .about-grid {
    display: grid;
    grid-template-columns: minmax(13rem, 0.65fr) minmax(18rem, 1.2fr) minmax(16rem, 0.85fr);
    align-items: start;
    gap: clamp(var(--space-8), 6vw, var(--space-20));
  }

  :global(.profile-slot) {
    max-width: 22rem;
  }

  h2 {
    max-width: 18ch;
    margin: 0 0 var(--space-8);
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    font-weight: var(--weight-regular);
    line-height: var(--leading-profile);
  }

  .statement > p:last-child {
    max-width: 40rem;
    color: var(--color-muted);
  }

  dl,
  dl div {
    margin: 0;
  }

  dl div {
    border-top: 1px solid var(--color-line);
    padding-block: var(--space-4);
  }

  dt {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  dd {
    margin: var(--space-1) 0 0;
  }

  @media (max-width: 60rem) {
    .about-grid {
      grid-template-columns: minmax(12rem, 0.7fr) 1.3fr;
    }

    .focus {
      grid-column: 2;
    }
  }

  @media (max-width: 44rem) {
    .about-header,
    .about-grid {
      grid-template-columns: 1fr;
    }

    .about-header .lead {
      margin-top: var(--space-8);
    }

    .focus {
      grid-column: 1;
    }

    :global(.profile-slot) {
      max-width: 100%;
      aspect-ratio: 4 / 3;
    }
  }
</style>
