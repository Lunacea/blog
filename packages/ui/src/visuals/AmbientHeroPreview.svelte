<script lang="ts">
  import AmbientHero from "./AmbientHero.svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let { weather = "neutral" }: { weather?: WeatherVisualCondition } = $props();
</script>

<section class="ambient-preview" aria-label="Ambient Hero visual preview">
  <AmbientHero {weather} />
  <div>
    <p>Visuals / Ambient Hero</p>
    <h2>Quiet structures,<br />growing records.</h2>
    <span>HTML text remains the semantic source of truth.</span>
  </div>
</section>

<style>
  .ambient-preview {
    position: relative;
    min-height: 70vh;
    overflow: clip;
    border: 1px solid var(--color-line);
  }

  .ambient-preview > div {
    position: relative;
    z-index: var(--z-visual);
    max-width: 42rem;
    padding: var(--space-10);
  }

  p,
  span {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  h2 {
    margin: var(--space-6) 0;
    font-family: var(--font-serif);
    font-size: var(--text-display);
    font-weight: var(--weight-regular);
    letter-spacing: var(--tracking-display);
    line-height: var(--leading-display);
  }

  @media (max-width: 44rem) {
    .ambient-preview > div {
      padding: var(--space-5);
    }

    h2 {
      font-size: var(--text-h2);
      line-height: var(--leading-title);
      overflow-wrap: anywhere;
    }
  }
</style>
