<script lang="ts">
  import Rainfall from "./Rainfall.svelte";
  import type { WeatherVisualCondition } from "./weather-visual.ts";

  let { condition }: { condition: WeatherVisualCondition } = $props();
  const id = $props.id();
  // Independent samples (not a lattice or modular stepping) avoid rows and tiles.
  // A fixed seed keeps hydration and the initial snowfall distribution identical.
  function snowflakes() {
    let seed = 0x4f19ac;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    return Array.from({ length: 132 }, () => {
      const x = random() * 1000;
      const y = random() * 1000;
      const drift = (random() - .5) * 5;
      const depth = random();
      const fallDuration = 11 + (1 - depth) * 27 + random() * 7;
      const fallDelay = -random() * fallDuration;
      const sway = 4 + random() * 17;
      const swayDuration = 3 + random() * 6;
      return { x, y, drift, depth, fallDuration, fallDelay, sway, swayDuration };

    });
  }
  const flakes = snowflakes();
</script>

{#if condition === "rain"}
  <Rainfall />
{:else if condition !== "neutral"}
  <svg
    class="weather-atmosphere pointer-events-none absolute inset-0 size-full overflow-hidden text-weather-cloud forced-colors:hidden print:hidden"
    viewBox="0 0 1000 1000"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    data-condition={condition}
  >
    <defs>
      <filter id={`${id}-cloud`} x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".004 .008" numOctaves="4" seed="17" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.8 -.6" />
        <feComposite in="SourceGraphic" operator="in" />
      </filter>
      <radialGradient id={`${id}-flake`}>
        <stop offset="0" stop-color="var(--color-weather-snow)" stop-opacity=".9" />
        <stop offset=".45" stop-color="var(--color-weather-snow)" stop-opacity=".75" />
        <stop offset="1" stop-color="var(--color-weather-snow)" stop-opacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-sun`} cx="16%" cy="0%" r="80%">
        <stop offset="0" stop-color="var(--color-weather-light)" stop-opacity=".24" />
        <stop offset=".35" stop-color="var(--color-weather-light)" stop-opacity=".07" />
        <stop offset="1" stop-color="var(--color-weather-light)" stop-opacity="0" />
      </radialGradient>
    </defs>
    {#if condition === "clear"}
      <path d="M0 0H1000V1000H0Z" fill={`url(#${id}-sun)`} />
    {:else if condition === "cloudy"}
      <g class="motion-full:animate-weather-drift opacity-18">
        <path d="M-200-200H1200V1200H-200Z" fill="currentColor" filter={`url(#${id}-cloud)`} />
      </g>
    {/if}
    {#if condition === "snow"}
      <g data-precipitation="snow">
        {#each flakes.slice(0, 100) as flake}
          <g transform={`translate(${flake.x} 0)`} opacity={.28 + flake.depth * .6}>
            <g
              class="[transform:translateY(var(--snow-rest))] motion-full:animate-weather-snowfall motion-reduce:animate-none"
              style={`--snow-duration:${flake.fallDuration}s;--snow-delay:${flake.fallDelay}s;--snow-rest:${flake.y}px;--snow-drift:${flake.drift * 14}px`}
            >
              <g
                class="motion-full:animate-weather-sway motion-reduce:animate-none"
                style={`--snow-sway:${flake.sway}px;--snow-sway-duration:${flake.swayDuration}s;--snow-delay:${flake.fallDelay}s`}
              >
                <ellipse rx={.7 + Math.pow(flake.depth, 3) * 4.2} ry={.9 + Math.pow(flake.depth, 3) * 3.2} fill={`url(#${id}-flake)`} />
              </g>
            </g>
          </g>
        {/each}
      </g>
    {/if}
  </svg>
{/if}
