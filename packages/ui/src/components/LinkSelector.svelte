<script lang="ts">
  import Icon, { type ApprovedIconName } from "../icons/Icon.svelte";
  import { cn } from "../utils.ts";

  export type LinkSelectorOption = {
    label: string;
    href: string;
    active: boolean;
    count?: number;
    icon?: ApprovedIconName;
    title?: string;
  };

  let {
    label,
    options,
    display = "text",
    class: className = "",
  }: {
    label: string;
    options: ReadonlyArray<LinkSelectorOption>;
    display?: "text" | "icon" | "strip";
    class?: string;
  } = $props();
</script>

{#if options.length}
  <nav
    class={cn(
      "link-selector flex flex-wrap items-baseline",
      display === "text" && "filter-selector",
      display === "text" && "grid grid-cols-[minmax(4.5rem,.14fr)_minmax(0,1fr)] gap-x-3 gap-y-1 max-sm:grid-cols-1",
      display === "icon" && "gap-1 text-(length:--text-small)",
      display === "strip" && "category-strip scrollbar-hidden flex-nowrap overflow-x-auto",
      className,
    )}
    aria-label={label}
  >
    {#if display === "text"}
      <span class="text-quiet text-(length:--text-caption) leading-ui tracking-(--tracking-ui)">{label}</span>
    {/if}
    <div class={cn("flex flex-wrap items-baseline gap-1", display === "strip" && "flex-nowrap items-stretch gap-2")}>
      {#each options as option}
        <a
          class={cn(
            "relative z-(--z-controls) inline-flex min-h-8 items-center gap-1 border border-rule bg-canvas px-2 text-(length:--text-caption) leading-ui text-quiet no-underline transition-colors duration-(--motion-duration-micro) ease-standard hover:border-ink hover:text-ink aria-current:border-ink aria-current:bg-ink aria-current:text-canvas",
            display === "icon" && "size-control justify-center border-transparent p-0 [&>svg]:text-(length:--text-body)",
            display === "strip" && "min-h-9 shrink-0 border-rule bg-transparent px-3 text-(length:--text-small) tracking-(--tracking-ui) whitespace-nowrap hover:bg-paper aria-current:border-ink",
          )}
          href={option.href}
          aria-label={display === "icon" ? option.label : undefined}
          title={option.title}
          aria-current={option.active ? "true" : undefined}
          data-sveltekit-noscroll
          data-sveltekit-keepfocus={display === "icon" ? true : undefined}
        >
          {#if option.icon}<Icon name={option.icon} />{/if}
          {#if display !== "icon"}<span>{option.label}</span>{/if}
          {#if option.count !== undefined}<small class="text-inherit opacity-65 tabular-nums">{option.count}</small>{/if}
        </a>
      {/each}
    </div>
  </nav>
{/if}
