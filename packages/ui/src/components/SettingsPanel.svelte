<script lang="ts">
  import { onMount } from "svelte";
  import {
    applyMotionPreference,
    readMotionPreference,
    setMotionPreference,
    subscribeMotionCapabilities,
    type MotionPreference,
  } from "../motion/preferences";
  import MotionGlyph from "../icons/MotionGlyph.svelte";

  type Connection = { saveData?: boolean };

  let motion = $state<MotionPreference>("reduced");
  let ready = $state(false);
  let motionFeedback = $state(false);
  const modes: MotionPreference[] = ["full", "reduced", "off"];
  const modeLabels: Record<MotionPreference, string> = {
    full: "Full",
    reduced: "Reduced",
    off: "Off",
  };
  const nextMotion = $derived(modes[(modes.indexOf(motion) + 1) % modes.length]);

  function canAnimateFeedback() {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    return !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !matchMedia("(forced-colors: active)").matches &&
      !connection?.saveData;
  }

  onMount(() => {
    motion = readMotionPreference();
    applyMotionPreference(motion);
    ready = true;
    motionFeedback = canAnimateFeedback();
    const stopCapabilities = subscribeMotionCapabilities(() => {
      applyMotionPreference(motion);
      motionFeedback = canAnimateFeedback();
    });
    return stopCapabilities;
  });

  function cycleMotion() {
    motion = nextMotion;
    setMotionPreference(motion);
  }
</script>

<button
  class="settings-trigger"
  type="button"
  data-ready={ready}
  data-mode={motion}
  data-motion-feedback={motionFeedback}
  aria-label={`Display: ${modeLabels[motion]}。${modeLabels[nextMotion]}に切り替える`}
  title={`Display: ${modeLabels[motion]}`}
  onclick={cycleMotion}
>
  <MotionGlyph mode={motion} />
</button>

<style>
  .settings-trigger {
    display: grid;
    width: var(--control-size);
    min-height: var(--control-size);
    place-items: center;
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    color: var(--color-muted);
    transition:
      color var(--motion-duration-fast) var(--motion-ease-standard),
      background var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .settings-trigger:hover,
  .settings-trigger:focus-visible {
    color: var(--color-background);
    background: var(--color-foreground);
  }

  :global(html[data-motion-preference="full"][data-motion="full"])
    .settings-trigger[data-mode="full"][data-motion-feedback="true"]:hover
    :global(.motion-glyph path),
  :global(html[data-motion-preference="reduced"][data-motion="reduced"])
    .settings-trigger[data-mode="reduced"][data-motion-feedback="true"]:hover
    :global(.motion-glyph path) {
    animation: motion-wave-phase var(--motion-duration-resume) linear infinite;
    animation-duration: var(--motion-duration-resume) !important;
    animation-iteration-count: infinite !important;
  }

  @keyframes motion-wave-phase {
    to {
      transform: translateX(-24px);
    }
  }
</style>
