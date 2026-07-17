<script lang="ts">
  import { onMount } from "svelte";
  import {
    applyMotionPreference,
    readMotionPreference,
    setMotionPreference,
    subscribeMotionCapabilities,
    type MotionPreference,
  } from "../motion/preferences";
  import * as Collapsible from "../primitives/collapsible";
  import Icon from "../icons/Icon.svelte";
  import { interfaceIcons } from "../icons/semantic.ts";
  import { announceHeaderDisclosure, listenForHeaderDisclosure } from "./header-disclosures.ts";

  let motion = $state<MotionPreference>("reduced");
  let ready = $state(false);
  let open = $state(false);

  $effect(() => {
    if (open) announceHeaderDisclosure("display");
  });

  onMount(() => {
    motion = readMotionPreference();
    applyMotionPreference(motion);
    ready = true;
    const stopCapabilities = subscribeMotionCapabilities(() => {
      applyMotionPreference(motion);
    });
    const stopDisclosure = listenForHeaderDisclosure("display", () => open = false);
    return () => {
      stopCapabilities();
      stopDisclosure();
    };
  });

  function setMotion(value: MotionPreference) {
    motion = value;
    setMotionPreference(value);
  }
</script>

<Collapsible.Root class="settings" data-ready={ready} bind:open>
  <Collapsible.Trigger class="settings-trigger">
    <Icon name={interfaceIcons.display} />Display
  </Collapsible.Trigger>
  <Collapsible.Content class="panel">
    <div class="motion-options" role="group" aria-label="Motion">
      <span>Motion</span>
      {#each [["full", "Full"], ["reduced", "Reduced"], ["off", "Off"]] as option}
        <button
          type="button"
          aria-pressed={motion === option[0]}
          onclick={() => setMotion(option[0] as MotionPreference)}
        >
          {option[1]}
        </button>
      {/each}
    </div>
  </Collapsible.Content>
</Collapsible.Root>

<style>
  :global(.settings) {
    position: relative;
  }

  :global(.settings-trigger) {
    display: flex;
    min-width: var(--control-size);
    min-height: var(--control-size);
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: var(--text-caption);
    list-style: none;
    color: var(--color-muted);
  }

  :global(.settings-trigger:hover),
  :global(.settings-trigger[data-state="open"]) { color: var(--color-foreground); }

  :global(.settings-trigger svg) {
    font-size: var(--text-small);
  }

  :global(.panel) {
    position: absolute;
    right: 0;
    top: calc(100% + var(--space-2));
    display: grid;
    justify-items: end;
    min-width: 8rem;
    gap: var(--space-3);
    transform-origin: top right;
  }

  :global(.panel[data-state="open"]) {
    animation: disclosure-in var(--motion-duration-base) var(--motion-ease-enter);
  }

  :global(.panel[data-state="closed"]) {
    animation: disclosure-out var(--motion-duration-fast) var(--motion-ease-exit);
  }

  .motion-options {
    display: grid;
    justify-items: end;
    gap: var(--space-3);
    font-size: var(--text-small);
  }

  .motion-options > span {
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  .motion-options button {
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    font: inherit;
    text-decoration-line: underline;
    text-decoration-color: transparent;
    text-underline-offset: var(--space-2);
    transition: color var(--motion-duration-fast) var(--motion-ease-standard),
      text-decoration-color var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .motion-options button:hover,
  .motion-options button:focus-visible,
  .motion-options button[aria-pressed="true"] {
    color: var(--color-foreground);
    text-decoration-color: currentColor;
  }

  .motion-options button[aria-pressed="true"]::before {
    content: "";
    display: inline-block;
    width: var(--space-2);
    height: 1px;
    margin-right: var(--space-2);
    background: currentColor;
    vertical-align: middle;
  }

  @keyframes disclosure-in {
    from {
      opacity: 0;
      transform: translateY(calc(var(--space-2) * -1));
    }
  }

  @keyframes disclosure-out {
    to {
      opacity: 0;
      transform: translateY(calc(var(--space-2) * -1));
    }
  }

  @media (max-width: 34rem) {
    :global(.settings-trigger) {
      width: var(--control-size);
      overflow: hidden;
      white-space: nowrap;
    }
  }
</style>
