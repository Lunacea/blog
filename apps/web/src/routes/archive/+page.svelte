<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
</script>

<PageHead
  title={`Archive — ${siteConfig.name}`}
  description="写真、場所、ワイン、瞬間を、時間と場所の手掛かりとともに残す個人アーカイブ。"
  path="/archive"
/>

<div class="page shell">
  <header class="archive-header" data-reveal>
    <p class="eyebrow">Fragments / Personal records</p>
    <h1 class="page-title">Archive</h1>
    <p class="lead">
      写真、場所、ワイン、瞬間。日記になる前の断片を、時間と場所の手掛かりとともに残します。
    </p>
  </header>
  <div class="groups">
    {#each data.groups as group, groupIndex}
      <section aria-labelledby={`group-${group.kind}`}>
        <div class="section-heading" data-reveal="line">
          <span class="section-number">{String(groupIndex + 1).padStart(2, "0")}</span>
          <h2 id={`group-${group.kind}`}>{group.label}</h2>
          <a href={"/archive/" + group.kind}>{group.entries.length} records</a>
        </div>
        <div class="preview-grid">
          {#each group.entries.slice(0, 2) as entry, index}
            <a
              class:shift={(groupIndex + index) % 2 === 1}
              href={"/archive/" + group.kind + "/" + entry.slug}
            >
              {#if entry.cover}
                <figure data-reveal="image" data-ratio={(groupIndex + index) % 3}>
                  <img
                    src={entry.cover.src}
                    alt={entry.cover.alt}
                    width={entry.cover.width}
                    height={entry.cover.height}
                    loading="lazy"
                    style:view-transition-name={`record-media-${entry.type}-${entry.slug}`}
                  />
                </figure>
              {/if}
              <span class="date">{entry.publishedAt}</span>
              <h3 style:view-transition-name={`record-${entry.type}-${entry.slug}`}>{entry.title}</h3>
              <p>{entry.summary}</p>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>

<style>
  .archive-header {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    margin-bottom: var(--section-space);
  }

  .archive-header .eyebrow {
    grid-column: 1 / -1;
  }

  .archive-header .lead {
    align-self: end;
  }

  .groups {
    display: grid;
    gap: clamp(var(--space-20), 12vw, var(--space-40));
  }

  .section-heading {
    display: grid;
    grid-template-columns: auto 1fr auto;
  }

  .section-number {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .preview-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: clamp(var(--space-4), 6vw, var(--space-20));
  }

  .preview-grid a {
    display: block;
    align-self: start;
    text-decoration: none;
  }

  .preview-grid a.shift {
    margin-top: var(--space-20);
  }

  figure {
    overflow: hidden;
    margin: 0;
    aspect-ratio: 4 / 3;
    background: var(--color-surface);
  }

  figure[data-ratio="1"] {
    aspect-ratio: 3 / 4;
  }

  figure[data-ratio="2"] {
    aspect-ratio: 16 / 10;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .date {
    display: block;
    margin-top: var(--space-4);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  h3 {
    margin: var(--space-1) 0;
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
  }

  p {
    max-width: 34rem;
    margin: 0;
    color: var(--color-muted);
  }

  @media (max-width: 52rem) {
    .archive-header,
    .preview-grid {
      grid-template-columns: 1fr;
    }

    .archive-header .lead {
      margin-top: var(--space-8);
    }

    .preview-grid a.shift {
      margin-top: 0;
    }

    figure,
    figure[data-ratio="1"],
    figure[data-ratio="2"] {
      aspect-ratio: 4 / 3;
    }
  }
</style>
