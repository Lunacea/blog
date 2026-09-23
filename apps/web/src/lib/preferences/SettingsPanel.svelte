<script lang="ts">
  import { onMount } from "svelte";
  import {
    setMotionPreference,
    subscribeMotionPreference,
    type MotionPreference,
  } from "./preferences.ts";
  import { MotionGlyph } from "@lunacea/ui/icons";

  type Connection = { saveData?: boolean };

  let preference = $state<MotionPreference>("off");
  let ready = $state(false);
  let motionFeedback = $state(false);
  const modes: MotionPreference[] = ["full", "off"];
  const modeLabels: Record<MotionPreference, string> = {
    full: "ON",
    off: "OFF",
  };
  const nextMotion = $derived(modes[(modes.indexOf(preference) + 1) % modes.length]);
  const componentId = $props.id();
  const tooltipId = `${componentId}-display-tooltip`;

  function canAnimateFeedback() {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    return !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !matchMedia("(forced-colors: active)").matches &&
      !connection?.saveData;
  }

  onMount(() => {
    const stop = subscribeMotionPreference((state) => {
      preference = state.motionPreference;
      motionFeedback = canAnimateFeedback();
    });
    ready = true;
    return stop;
  });

  function cycleMotion() {
    setMotionPreference(nextMotion);
  }
</script>

<div class="settings has-tooltip group/display relative grid size-control place-items-center">
  <button
    class="settings-trigger motion-preference-feedback group/display grid size-control min-h-control cursor-pointer place-items-center border-0 bg-transparent p-0 text-quiet pressable [--press-scale:0.9] transition-[translate,scale,color,background-color,border-color] duration-(--motion-duration-base) ease-signature hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas motion-full:data-[mode=full]:data-[motion-feedback=true]:hover:[&_.motion-glyph_path]:animate-motion-wave"
    type="button"
    data-ready={ready}
    data-mode={preference}
    data-motion-feedback={motionFeedback}
    aria-describedby={tooltipId}
    aria-label={`アニメーション: ${modeLabels[preference]}。${modeLabels[nextMotion]}に切り替える`}
    onclick={cycleMotion}
  >
    <MotionGlyph mode={preference} />
  </button>
  <span class="tooltip" id={tooltipId} role="tooltip"><span>{preference === "full" ? "動きを止める" : "動きをつける"}</span></span>
</div>
