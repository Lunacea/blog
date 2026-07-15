<script lang="ts">
  import { onMount } from "svelte";

  type Theme = "auto" | "light" | "dark";
  type Motion = "full" | "reduced" | "off";

  let theme = $state<Theme>("auto");
  let motion = $state<Motion>("reduced");
  let ready = $state(false);

  onMount(() => {
    theme = (localStorage.getItem("lunacea-theme") as Theme | null) ?? "auto";
    motion = (localStorage.getItem("lunacea-motion") as Motion | null) ??
      (matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full");
    ready = true;
  });

  function setTheme(value: Theme) {
    theme = value;
    localStorage.setItem("lunacea-theme", value);
    document.documentElement.dataset.theme = value;
    window.dispatchEvent(new CustomEvent("lunacea:theme", { detail: value }));
  }

  function setMotion(value: Motion) {
    motion = value;
    localStorage.setItem("lunacea-motion", value);
    document.documentElement.dataset.motion = value;
    window.dispatchEvent(new CustomEvent("lunacea:motion", { detail: value }));
  }
</script>

<details class="settings" data-ready={ready}>
  <summary>Display</summary>
  <div class="panel">
    <label>
      <span>Theme</span>
      <select value={theme} onchange={(event) => setTheme(event.currentTarget.value as Theme)}>
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label>
      <span>Motion</span>
      <select value={motion} onchange={(event) => setMotion(event.currentTarget.value as Motion)}>
        <option value="full">Full</option>
        <option value="reduced">Reduced</option>
        <option value="off">Off</option>
      </select>
    </label>
  </div>
</details>

<style>
  details {
    position: fixed;
    z-index: 30;
    right: var(--space-4);
    bottom: var(--space-4);
  }

  summary {
    display: grid;
    min-width: 4.5rem;
    min-height: var(--control-size);
    place-items: center;
    border: 1px solid var(--color-line);
    background: var(--color-glass);
    backdrop-filter: blur(var(--glass-blur));
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    list-style: none;
  }

  .panel {
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

  select {
    border: 1px solid var(--color-line);
    border-radius: var(--radius-none);
    padding-inline: var(--space-2);
    background: var(--color-background);
  }

  @media (max-width: 52rem) {
    details {
      z-index: 10;
      top: calc(var(--site-header-block) + var(--space-4));
      right: var(--space-4);
      bottom: auto;
    }

    :global(body:has(.sample-banner)) details {
      top: calc(var(--site-header-block) + 5.75rem + var(--space-4));
    }
  }
</style>
