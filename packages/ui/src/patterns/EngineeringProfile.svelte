<script lang="ts">
  import Icon from "../icons/Icon.svelte";
  import type { ApprovedIconName } from "../icons/Icon.svelte";

  let {
    categories,
  }: {
    categories: readonly {
      title: string;
      technologies: readonly { label: string; icon: ApprovedIconName }[];
    }[];
  } = $props();
</script>

<section class="w-full" aria-labelledby="engineering-title">
  <h2 class="mb-8 text-center font-editorial text-(length:--text-h2) font-regular leading-heading wrap-anywhere" id="engineering-title">Engineering</h2>
  <div class="grid grid-cols-4 gap-x-8 gap-y-10 max-md:grid-cols-2 max-md:gap-y-8 max-xs:grid-cols-1">
    {#each categories as category}
      <section class="min-w-0" aria-labelledby={`engineering-${category.title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}>
        <h3 class="mb-4 text-(length:--text-caption) font-label leading-ui tracking-(--tracking-label) text-quiet uppercase wrap-anywhere" id={`engineering-${category.title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}>
          {category.title}
        </h3>
        <ul class="m-0 grid list-none gap-3 p-0">
          {#each category.technologies as technology}
            <li class="grid grid-cols-[var(--space-5)_minmax(0,1fr)] items-center gap-2 text-(length:--text-small) leading-ui">
              <span class="grid w-4 place-items-center justify-self-center text-support [&_svg]:size-[1em]"><Icon name={technology.icon} /></span>
              <span class="min-w-0 wrap-anywhere">{technology.label}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
</section>
