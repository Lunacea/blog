<script lang="ts">
  import Icon, { type ApprovedIconName } from "./Icon.svelte";
  import { interfaceIcons, tagIconName } from "./semantic.ts";

  const groups: ReadonlyArray<{
    title: string;
    icons: ReadonlyArray<{ name: ApprovedIconName; label: string }>;
  }> = [
    {
      title: "Interface",
      icons: Object.entries(interfaceIcons).map(([label, name]) => ({ name, label })),
    },
    {
      title: "Technology",
      icons: ["SvelteKit", "Deno 2", "TypeScript", "Three.js", "WebGL", "Threlte"].map(
        (label) => ({ label, name: tagIconName(label) }),
      ),
    },
    {
      title: "Fallback",
      icons: [{ label: "Unmapped editorial tag", name: tagIconName("Research") }],
    },
  ];
</script>

<div class="icon-gallery">
  {#each groups as group}
    <section aria-labelledby={`icon-${group.title.toLowerCase()}`}>
      <h2 id={`icon-${group.title.toLowerCase()}`}>{group.title}</h2>
      <ul>
        {#each group.icons as icon}
          <li>
            <Icon name={icon.name} decorative={false} label={icon.label} />
            <div><strong>{icon.label}</strong><code>{icon.name}</code></div>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .icon-gallery {
    display: grid;
    gap: var(--space-12);
  }

  h2 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-small);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  ul {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(100%, var(--layout-grid-compact)), 1fr)
    );
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    min-width: 0;
    grid-template-columns: var(--control-size) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3);
    border-top: 1px solid var(--color-line);
    padding-block: var(--space-3);
  }

  li :global(svg) {
    font-size: var(--text-h3);
  }

  li div {
    display: grid;
    min-width: 0;
  }

  strong {
    font-size: var(--text-small);
    font-weight: var(--weight-component);
  }

  code {
    overflow-wrap: anywhere;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }
</style>
