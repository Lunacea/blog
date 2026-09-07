<script lang="ts">
  import { cn } from "../utils.ts";
  import type { IndexEntry } from "./index-entry.ts";

  let {
    entries,
    label,
    bleed = false,
  }: {
    entries: readonly IndexEntry[];
    label: string;
    /** Rules span the viewport while the content stays on the page grid. */
    bleed?: boolean;
  } = $props();

  const inner = $derived(
    bleed
      ? "mx-auto w-full max-w-content px-(--layout-gutter)"
      : "w-full",
  );
</script>

<ol class="index-list m-0 grid list-none border-t border-ink p-0" aria-label={label}>
  {#each entries as entry (entry.slug)}
    <li
      class="group relative isolate border-b border-rule before:absolute before:inset-x-0 before:-bottom-px before:h-px before:origin-left before:scale-x-0 before:bg-ink before:transition-[scale] before:duration-(--motion-duration-base) before:ease-enter hover:before:scale-x-100 focus-within:before:scale-x-100 active:before:scale-x-100 motion-off:before:duration-(--motion-duration-immediate)"
    >
      <!--
        A pane of liquid glass slides under the row being read: a thin, saturated fill over a
        strong blur, lit along its top edge only. It never touches the type, and it adds no side rules.
      -->
      <span
        class="pointer-events-none absolute inset-0 -z-1 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface)_34%,transparent),color-mix(in_srgb,var(--color-surface)_14%,transparent))] opacity-0 border-t border-t-[color-mix(in_srgb,var(--color-light-source)_34%,transparent)] backdrop-blur-[18px] backdrop-saturate-150 transition-opacity duration-(--motion-duration-base) ease-standard group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 motion-off:duration-(--motion-duration-immediate) forced-colors:hidden print:hidden"
        aria-hidden="true"
      ></span>
      <div class={cn(
        "grid grid-cols-1 items-center gap-x-(--space-8) gap-y-(--space-3) py-(--index-row-space) md:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,9rem)]",
        inner,
      )}>
        <time class="font-stretch-84% text-folio leading-none tracking-folio text-quiet tabular-nums" datetime={entry.publishedAt}>{entry.publishedAt.replaceAll("-", ".")}</time>

        <div class="min-w-0">
          <h3 class="m-0 text-index leading-tight font-strong tracking-heading text-balance">
            <!-- The colour comes from the token, not from an inherit chain: a registered custom
                 property change does not reliably invalidate `color: inherit`. -->
            <a class="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:no-underline" href={entry.href}>{entry.title}</a>
          </h3>

          {#if entry.summary}
            <div class="grid grid-rows-[1fr] transition-[grid-template-rows] duration-(--motion-duration-base) ease-enter md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus-within:grid-rows-[1fr] motion-off:duration-(--motion-duration-immediate)">
              <div class="overflow-hidden">
                <p class="mt-(--space-3) mb-0 max-w-prose text-small leading-copy text-quiet">{entry.summary}</p>
              </div>
            </div>
          {/if}

          {#if entry.tags?.length}
            <p class="mt-(--space-3) mb-0 flex flex-wrap gap-x-(--space-3) gap-y-(--space-1) text-small leading-none text-quiet">
              {#each entry.tags.slice(0, 4) as tag}<span>#{tag}</span>{/each}
            </p>
          {/if}
        </div>

        <span class="font-stretch-84% text-folio leading-none tracking-folio text-quiet uppercase md:text-right">{entry.category ?? ""}</span>
      </div>
    </li>
  {/each}
</ol>
