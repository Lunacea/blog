<script lang="ts">
  import Icon, { type ApprovedIconName } from "./Icon.svelte";
  import BackGlyph from "./BackGlyph.svelte";
  import DisclosureGlyph from "./DisclosureGlyph.svelte";
  import ForwardGlyph from "./ForwardGlyph.svelte";
  import HeartGlyph from "./HeartGlyph.svelte";
  import IndexGlyph from "./IndexGlyph.svelte";
  import MotionGlyph from "./MotionGlyph.svelte";
  import SearchGlyph from "./SearchGlyph.svelte";
  import ThemeGlyph from "./ThemeGlyph.svelte";
  import { interfaceIcons, socialIcons, tagIconName } from "./semantic.ts";

  let { tags = ["SvelteKit", "Deno", "TypeScript", "Three.js", "WebGL", "Research"] }: {
    tags?: readonly string[];
  } = $props();

  const named = (source: Record<string, ApprovedIconName>) =>
    Object.entries(source).map(([label, name]) => ({ label, name }));

  const cell = "grid min-h-(--space-20) content-center justify-items-center gap-(--space-2) " +
    "border border-rule p-(--space-3) text-center";
  const caption = "font-mono text-caption leading-none wrap-anywhere text-quiet";
  const heading = "m-0 font-stretch-84% text-folio tracking-folio text-quiet uppercase";
  const grid = "m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-(--space-2) p-0";
</script>

<div class="grid gap-(--space-8) p-(--space-6) text-ink">
  <section class="grid gap-(--space-3)">
    <h2 class={heading}>Glyphs</h2>
    <p class="m-0 max-w-prose text-small text-quiet">
      The site's own strokes: a 24 unit box, non-scaling 1.75 stroke, round ends. The arrows travel
      on hover and focus, so hover a cell to see them.
    </p>
    <ul class={grid}>
      <li class={cell}><a href="#back" aria-label="Back"><BackGlyph /></a><span class={caption}>BackGlyph</span></li>
      <li class={cell}><a href="#forward" aria-label="Forward"><ForwardGlyph /></a><span class={caption}>ForwardGlyph</span></li>
      <li class={cell}><DisclosureGlyph /><span class={caption}>DisclosureGlyph closed</span></li>
      <li class={cell}><div data-state="open"><DisclosureGlyph /></div><span class={caption}>DisclosureGlyph open</span></li>
      <li class={cell}><HeartGlyph /><span class={caption}>HeartGlyph</span></li>
      <li class={cell}><HeartGlyph filled /><span class={caption}>HeartGlyph filled</span></li>
      <li class={cell}><IndexGlyph /><span class={caption}>IndexGlyph</span></li>
      <li class={cell}><SearchGlyph /><span class={caption}>SearchGlyph</span></li>
      <li class={cell}><ThemeGlyph /><span class={caption}>ThemeGlyph</span></li>
      <li class={cell}><MotionGlyph mode="full" /><span class={caption}>MotionGlyph full</span></li>
      <li class={cell}><MotionGlyph mode="reduced" /><span class={caption}>MotionGlyph reduced</span></li>
      <li class={cell}><MotionGlyph mode="off" /><span class={caption}>MotionGlyph off</span></li>
    </ul>
  </section>

  <section class="grid gap-(--space-3)">
    <h2 class={heading}>Interface</h2>
    <ul class={grid}>
      {#each named(interfaceIcons) as icon}
        <li class={cell}><Icon name={icon.name} /><span class={caption}>{icon.label}</span></li>
      {/each}
    </ul>
  </section>

  <section class="grid gap-(--space-3)">
    <h2 class={heading}>Social</h2>
    <ul class={grid}>
      {#each named(socialIcons) as icon}
        <li class={cell}><Icon name={icon.name} /><span class={caption}>{icon.label}</span></li>
      {/each}
    </ul>
  </section>

  <section class="grid gap-(--space-3)">
    <h2 class={heading}>Tags</h2>
    <p class="m-0 max-w-prose text-small text-quiet">
      A tag resolves to its own mark where one exists; anything unmapped falls back to the generic
      tag glyph, and a tag showing that fallback carries no icon in the interface.
    </p>
    <ul class={grid}>
      {#each tags as tag}
        <li class={cell}>
          <Icon name={tagIconName(tag)} />
          <span class={caption}>{tag}</span>
          {#if tagIconName(tag) === interfaceIcons.tag}<span class={caption}>fallback</span>{/if}
        </li>
      {/each}
    </ul>
  </section>
</div>
