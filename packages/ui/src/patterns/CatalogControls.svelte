<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { Icon, interfaceIcons } from "../icons/index.ts";

  let {
    label,
    resultCount,
    activeFilterCount = 0,
    collapseFilters = false,
    clearHref,
    children,
  }: {
    label: string;
    resultCount: number;
    activeFilterCount?: number;
    collapseFilters?: boolean;
    clearHref?: string;
    children: Snippet;
  } = $props();

  // Server HTML remains expanded so filters are complete without JavaScript.
  let filtersOpen = $state(true);

  onMount(() => {
    const compact = matchMedia("(max-width: 44rem)");
    const synchronize = () => (filtersOpen = !collapseFilters && !compact.matches);
    synchronize();
    compact.addEventListener("change", synchronize);
    return () => compact.removeEventListener("change", synchronize);
  });
</script>

<section class="catalog-controls mb-8 grid gap-3" aria-label={label} data-catalog-controls>
  <details
    class="filter-disclosure [interpolate-size:allow-keywords] details-content:h-0 details-content:overflow-hidden details-content:opacity-0 details-content:transition-[height,content-visibility,opacity] details-content:transition-discrete details-content:duration-(--motion-duration-base) details-content:ease-standard open:details-content:h-auto open:details-content:opacity-100 motion-reduced:details-content:duration-(--motion-duration-immediate) motion-off:details-content:duration-(--motion-duration-immediate)"
    bind:open={filtersOpen}
  >
    <summary
      class="hidden min-h-control cursor-pointer list-none items-center justify-between border-y border-rule text-(length:--text-small) tracking-(--tracking-ui) text-quiet max-sm:flex [&::-webkit-details-marker]:hidden after:grid after:size-8 after:place-items-center after:text-ink after:content-['+'] open:after:rotate-180 open:after:content-['−'] motion-reduce:after:transition-none"
      >絞り込み{activeFilterCount ? ` / ${activeFilterCount}件の条件` : ""}</summary
    >
    <div class="filter-groups grid gap-2 max-sm:pt-3">{@render children()}</div>
  </details>

  <div
    class="control-heading flex flex-wrap items-center justify-start gap-3 text-(length:--text-caption) tracking-(--tracking-ui) text-quiet tabular-nums"
    aria-live="polite"
  >
    <span>{resultCount}件{activeFilterCount ? ` / ${activeFilterCount}件の条件` : ""}</span>
    <span class="clear-slot inline-flex min-h-8 items-center">
      {#if clearHref}
        <a
          class="inline-flex min-h-8 items-center gap-1 border border-rule bg-canvas px-2 text-(length:--text-caption) text-quiet no-underline hover:border-ink hover:bg-ink hover:text-canvas focus-visible:border-ink focus-visible:bg-ink focus-visible:text-canvas"
          href={clearHref}
          data-sveltekit-noscroll
          title="条件を解除"
        >
          <Icon name={interfaceIcons.reset} />条件を解除
        </a>
      {/if}
    </span>
  </div>
</section>
