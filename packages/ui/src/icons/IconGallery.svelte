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

<div class="grid gap-(--space-12)">
  {#each groups as group}
    <section aria-labelledby={`icon-${group.title.toLowerCase()}`}>
      <h2 class="mb-(--space-4) text-small tracking-label uppercase" id={`icon-${group.title.toLowerCase()}`}>{group.title}</h2>
      <ul class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,var(--layout-grid-compact)),1fr))] gap-(--space-3) p-0">
        {#each group.icons as icon}
          <li class="grid min-w-0 grid-cols-[var(--control-size)_minmax(0,1fr)] items-center gap-(--space-3) border-t border-rule py-(--space-3) [&>svg]:text-h3">
            <Icon name={icon.name} decorative={false} label={icon.label} />
            <div class="grid min-w-0 max-w-full"><strong class="min-w-0 max-w-full wrap-anywhere text-small font-component">{icon.label}</strong><code class="min-w-0 max-w-full wrap-anywhere font-mono text-caption text-quiet">{icon.name}</code></div>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
