<script lang="ts">
  import { onMount } from "svelte";

  /**
   * The filter ships with the server-rendered page so the reference already resolves on the first
   * paint: the inline theme script declares the opening before anything is drawn, and the
   * displacement therefore runs with the page instead of replaying once hydration catches up.
   */
  let running = $state(true);

  onMount(() => {
    const root = document.documentElement;
    // Only a document load declares the opening; a client-side visit never does, so navigating
    // back to Home inside the app does not replay it, and the filter is dropped straight away.
    if (root.dataset.motion !== "full" || root.dataset.homeOpening !== "active") {
      running = false;
      return;
    }
    const finish = () => {
      delete root.dataset.homeOpening;
      running = false;
    };
    const timer = window.setTimeout(finish, 1450);
    const changed = () => { if (root.dataset.motion !== "full") finish(); };
    window.addEventListener("lunacea:motion", changed);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("lunacea:motion", changed);
      finish();
    };
  });
</script>

<!--
  The masthead settles out of wet ink: the displacement runs from a heavy warp down to nothing and
  the filter is then removed, so it costs nothing for the rest of the session. This distortion is
  the opening — no other layer sweeps or grains on top of it.
-->
{#if running}
  <svg class="absolute size-0" aria-hidden="true" focusable="false">
    <filter id="opening-ink" x="-14%" y="-45%" width="128%" height="190%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".004 .011" numOctaves="3" seed="7" result="warp">
        <animate attributeName="baseFrequency" dur="1.25s" fill="freeze"
          values=".004 .011;.009 .006;.006 .01;.005 .012" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="46" xChannelSelector="R" yChannelSelector="G">
        <animate attributeName="scale" dur="1.25s" fill="freeze"
          values="46;31;16;5;0" keyTimes="0;.3;.56;.8;1" calcMode="spline"
          keySplines=".2 0 .35 1;.2 0 .35 1;.2 0 .35 1;.2 0 .35 1" />
      </feDisplacementMap>
    </filter>
  </svg>
{/if}
