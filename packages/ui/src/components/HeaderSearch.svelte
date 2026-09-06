<script lang="ts">
  import { tick } from "svelte";
  import { SearchGlyph } from "../icons/index.ts";
  import * as Collapsible from "../primitives/collapsible";
  import { Input } from "../primitives/index.ts";
  import { announceHeaderDisclosure, listenForHeaderDisclosure } from "./header-disclosures.ts";

  let {
    action = "/articles",
    value = "",
    variant = "control",
  }: {
    action?: string;
    value?: string;
    /** `static` is the always-expanded form used where the control region is unavailable. */
    variant?: "control" | "static";
  } = $props();

  const fieldId = $derived(variant === "control" ? "header-search" : "header-search-static");
  let open = $state(false);
  let trigger = $state<HTMLButtonElement | null>(null);
  let field = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (variant !== "control") return;
    if (!open) return;
    announceHeaderDisclosure("search");
    void tick().then(() => field?.focus());
  });

  $effect(() => {
    if (variant !== "control") return;
    return listenForHeaderDisclosure("search", () => open = false);
  });

  async function dismiss(returnFocus = false) {
    if (!open) return;
    open = false;
    if (!returnFocus) return;
    await tick();
    trigger?.focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    void dismiss(true);
  }
</script>

{#snippet form(id: string)}
  <form
    class="header-search-form grid grid-cols-[minmax(0,1fr)_var(--control-size)] items-stretch"
    {action}
    method="GET"
    role="search"
    data-sveltekit-keepfocus
  >
    <label class="sr-only" for={id}>記事を検索</label>
    <Input
      bind:ref={field}
      class="min-h-control rounded-sharp border-r-0 border-rule px-3 text-(length:--text-small) focus-visible:border-ink focus-visible:shadow-none focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-ink"
      {id}
      type="search"
      name="q"
      {value}
      maxlength={120}
      placeholder="キーワードで記事を探す"
      enterkeyhint="search"
    />
    <input type="hidden" name="view" value="list" />
    <button
      class="grid size-control cursor-pointer place-items-center border border-rule bg-canvas p-0 text-small text-ink hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas focus-visible:shadow-none focus-visible:outline-1 focus-visible:outline-offset-0"
      type="submit"
      aria-label="記事を検索"
    >
      <SearchGlyph />
    </button>
  </form>
{/snippet}

<svelte:window onkeydown={handleKeydown} />

{#if variant === "static"}
  <div class="w-full max-w-(--container-grid-wide)">{@render form(fieldId)}</div>
{:else}
  <Collapsible.Root class="header-search group/search relative block" bind:open>
    <Collapsible.Trigger
      bind:ref={trigger}
      class="grid size-control min-h-control cursor-pointer place-items-center border-0 bg-transparent p-0 text-quiet transition-colors duration-(--motion-duration-fast) ease-standard hover:bg-ink hover:text-canvas focus-visible:bg-ink focus-visible:text-canvas data-[state=open]:bg-ink data-[state=open]:text-canvas"
      aria-controls="header-search-panel"
      aria-describedby="header-search-tooltip"
      aria-label={open ? "検索を閉じる" : "記事を検索"}
    >
      <SearchGlyph />
    </Collapsible.Trigger>
    <span
      class="search-tooltip pointer-events-none absolute top-[calc(100%+var(--space-1))] right-0 z-(--z-overlay) w-max border border-rule bg-paper px-(--space-2) py-(--space-1) text-caption leading-ui whitespace-nowrap text-ink opacity-0 shadow-paper transition-opacity duration-(--motion-duration-fast) ease-standard group-hover/search:opacity-100 group-focus-within/search:opacity-100 data-[open=true]:opacity-0! motion-reduced:transition-none motion-off:transition-none forced-colors:shadow-none"
      id="header-search-tooltip"
      role="tooltip"
      data-open={open}
    >記事を検索</span>
    <Collapsible.Content
      id="header-search-panel"
      class="search-panel absolute top-[calc(100%+var(--space-2))] right-0 z-(--z-overlay) w-88 max-w-[calc(100vw-2*var(--layout-gutter))] origin-top-right border border-rule bg-(--color-glass) p-(--space-3) shadow-ui-overlay backdrop-blur-glass data-[state=open]:animate-disclosure-in data-[state=closed]:animate-disclosure-out"
    >
      {@render form(fieldId)}
    </Collapsible.Content>
  </Collapsible.Root>
{/if}
