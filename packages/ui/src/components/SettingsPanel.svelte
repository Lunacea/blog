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
    full: "フル",
    reduced: "控えめ",
    off: "なし",
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

<div class="settings group/display relative grid size-control place-items-center">
  <button
    class="settings-trigger motion-preference-feedback group/display grid size-control min-h-control cursor-pointer place-items-center border-0 bg-transparent p-0 text-quiet transition-colors duration-(--motion-duration-fast) ease-standard hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas motion-full:data-[mode=full]:data-[motion-feedback=true]:hover:[&_.motion-glyph_path]:animate-motion-wave motion-reduced:data-[mode=reduced]:data-[motion-feedback=true]:hover:[&_.motion-glyph_path]:animate-motion-wave"
    type="button"
    data-ready={ready}
    data-mode={motion}
    data-motion-feedback={motionFeedback}
    aria-describedby="display-tooltip"
    aria-label={`モーション: ${modeLabels[motion]}。${modeLabels[nextMotion]}に切り替える`}
    onclick={cycleMotion}
  >
    <MotionGlyph mode={motion} />
  </button>
  <span
    class="display-tooltip pointer-events-none absolute top-[calc(100%+var(--space-1))] right-0 z-(--z-overlay) w-max border border-rule bg-paper px-(--space-2) py-(--space-1) text-caption leading-ui whitespace-nowrap text-ink opacity-0 shadow-paper transition-opacity duration-(--motion-duration-fast) ease-standard group-hover/display:opacity-100 group-focus-within/display:opacity-100 motion-reduced:transition-none motion-off:transition-none forced-colors:shadow-none"
    id="display-tooltip"
    role="tooltip"
  >モーション: {modeLabels[motion]}</span>
</div>
