<script lang="ts">
  import { onMount } from "svelte";
  import {
    applyDisplayPreferences,
    readMotionPreference,
    readThemePreference,
    setMotionPreference,
    setThemePreference,
    subscribeDisplayCapabilities,
    type MotionPreference,
    type ThemePreference,
  } from "../motion/preferences";
  import * as Collapsible from "../primitives/collapsible";
  import { NativeSelect } from "../primitives";
  import Icon from "../icons/Icon.svelte";
  import { interfaceIcons } from "../icons/semantic.ts";

  let theme = $state<ThemePreference>("auto");
  let motion = $state<MotionPreference>("reduced");
  let ready = $state(false);

  onMount(() => {
    theme = readThemePreference();
    motion = readMotionPreference();
    applyDisplayPreferences(theme, motion);
    ready = true;
    return subscribeDisplayCapabilities(() => {
      applyDisplayPreferences(theme, motion);
    });
  });

  function setTheme(value: ThemePreference) {
    theme = value;
    setThemePreference(value);
  }

  function setMotion(value: MotionPreference) {
    motion = value;
    setMotionPreference(value);
  }
</script>

<Collapsible.Root class="settings" data-ready={ready}>
  <Collapsible.Trigger class="settings-trigger">
    <Icon name={interfaceIcons.display} />Display
  </Collapsible.Trigger>
  <Collapsible.Content class="panel">
    <label>
      <span>Theme</span>
      <NativeSelect
        value={theme}
        onchange={(event) => setTheme(event.currentTarget.value as ThemePreference)}
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </NativeSelect>
    </label>
    <label>
      <span>Motion</span>
      <NativeSelect
        value={motion}
        onchange={(event) => setMotion(event.currentTarget.value as MotionPreference)}
      >
        <option value="full">Full</option>
        <option value="reduced">Reduced</option>
        <option value="off">Off</option>
      </NativeSelect>
    </label>
  </Collapsible.Content>
</Collapsible.Root>

<style>
  :global(.settings) {
    position: fixed;
    z-index: var(--z-overlay);
    right: var(--space-4);
    bottom: var(--space-4);
  }

  :global(.settings-trigger) {
    display: flex;
    min-width: 4.5rem;
    min-height: var(--control-size);
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid var(--color-line);
    background: var(--color-glass);
    backdrop-filter: blur(var(--glass-blur));
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    list-style: none;
  }

  :global(.settings-trigger svg) {
    font-size: var(--text-small);
  }

  :global(.panel) {
    position: absolute;
    right: 0;
    bottom: calc(100% + var(--space-2));
    display: grid;
    width: 15rem;
    gap: var(--space-3);
    border: 1px solid var(--color-line);
    padding: var(--space-4);
    background: var(--color-glass);
    box-shadow: var(--shadow-overlay);
    backdrop-filter: blur(var(--glass-blur));
  }

  label {
    display: grid;
    grid-template-columns: 1fr 7rem;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-small);
  }

  @media (max-width: 52rem) {
    :global(.settings) {
      z-index: var(--z-controls);
      top: calc(var(--site-header-block) + var(--space-4));
      right: var(--space-4);
      bottom: auto;
    }

    :global(body:has(.sample-banner) .settings) {
      top: calc(var(--site-header-block) + 5.75rem + var(--space-4));
    }
  }
</style>
