<script lang="ts">
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let {
    condition = "neutral",
    hidden = false,
  }: {
    condition?: WeatherVisualCondition;
    hidden?: boolean;
  } = $props();
</script>

<div class="weather-backdrop {condition}" class:hidden aria-hidden="true">
  <div class="layer clear-layer"></div>
  <div class="layer cloudy-layer"></div>
  <div class="layer rain-layer"></div>
  <div class="layer snow-layer"></div>
</div>

<style>
  .weather-backdrop {
    position: fixed;
    z-index: var(--z-weather);
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 1;
    transition: opacity var(--motion-duration-base) var(--motion-ease-standard);
  }

  .hidden { opacity: 0; }

  .layer {
    position: absolute;
    inset: -12%;
    opacity: 0;
    transition: opacity var(--motion-duration-base) var(--motion-ease-standard);
  }

  .clear .clear-layer {
    opacity: 0.26;
  }

  .clear-layer {
    background: radial-gradient(circle at 18% 14%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 36%);
    animation: weather-breathe calc(var(--motion-duration-ambient) * 3) var(--motion-ease-standard) infinite alternate;
  }

  .cloudy .cloudy-layer {
    opacity: 0.22;
  }

  .cloudy-layer {
    background:
      radial-gradient(ellipse at 25% 18%, color-mix(in srgb, var(--color-muted) 22%, transparent), transparent 42%),
      radial-gradient(ellipse at 76% 34%, color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 48%);
    filter: blur(var(--glass-blur));
    animation: weather-drift calc(var(--motion-duration-ambient) * 4) var(--motion-ease-standard) infinite alternate;
  }

  .rain .rain-layer {
    opacity: 0.14;
  }

  .rain-layer {
    background-image:
      radial-gradient(ellipse, color-mix(in srgb, var(--color-secondary) 34%, transparent) 0 .04rem, transparent .12rem),
      radial-gradient(ellipse, color-mix(in srgb, var(--color-primary) 22%, transparent) 0 .05rem, transparent .14rem);
    background-position: 0 0, 4rem 6rem;
    background-size: 11rem 16rem, 17rem 22rem;
    filter: blur(.01rem);
    animation: weather-rain calc(var(--motion-duration-ambient) * 4) linear infinite;
  }

  .snow .snow-layer {
    opacity: 0.2;
  }

  .snow-layer {
    background-image:
      radial-gradient(circle, var(--color-foreground) 0 1px, transparent 1.5px),
      radial-gradient(circle, var(--color-muted) 0 1.25px, transparent 1.75px);
    background-position: 0 0, 4rem 6rem;
    background-size: 12rem 18rem, 19rem 28rem;
    animation: weather-snow calc(var(--motion-duration-ambient) * 5) linear infinite;
  }

  @keyframes weather-breathe { to { transform: scale(1.025) translate3d(1%, 0, 0); } }
  @keyframes weather-drift { to { transform: translate3d(3%, 1%, 0); } }
  @keyframes weather-rain {
    to { background-position: 0 32rem, 4rem 50rem; }
  }
  @keyframes weather-snow {
    to { background-position: 12rem 18rem, 23rem 34rem; }
  }

  :global(html[data-motion="off"]) .layer,
  :global(html[data-motion="reduced"]) .layer {
    animation: none;
  }

  @media (prefers-reduced-motion: reduce), (forced-colors: active) {
    .layer { animation: none; }
  }
</style>
