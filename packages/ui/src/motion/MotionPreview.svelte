<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "../primitives";
  import { resetNavigationMocks, simulateNavigation } from "$app/navigation";
  import RevealManager from "./RevealManager.svelte";
  import { installPageTransitions } from "./page-transitions.ts";

  let { mode = "reveal" }: { mode?: "reveal" | "page" } = $props();
  let frame = $state<"index" | "detail">("index");
  let transitionRuns = $state(0);

  resetNavigationMocks();
  installPageTransitions();

  onMount(() => {
    const viewTransitionDocument = document as Document & {
      startViewTransition?: (update: () => void | Promise<void>) => unknown;
    };
    const original = viewTransitionDocument.startViewTransition?.bind(document);
    if (!original) return;
    viewTransitionDocument.startViewTransition = (update) => {
      transitionRuns += 1;
      return original(update);
    };
    return () => {
      viewTransitionDocument.startViewTransition = original;
    };
  });

  async function navigate() {
    await simulateNavigation(() => {
      frame = frame === "index" ? "detail" : "index";
    });
  }

  async function replayReveal() {
    document.querySelectorAll<HTMLElement>(".motion-preview [data-reveal]").forEach((element) => {
      delete element.dataset.visible;
    });
    await simulateNavigation(() => {});
  }
</script>

<RevealManager />

<main class="motion-preview mx-auto grid w-[min(calc(100%-(2*var(--layout-gutter))),64rem)] gap-(--space-10) py-(--section-space)" data-mode={mode}>
  <header>
    <p class="m-0 font-mono text-caption text-quiet">Motion / {mode === "reveal" ? "Reveal" : "Page transition"}</p>
    <h2 class="mt-(--space-3) max-w-[16ch] font-serif text-h2 leading-tight font-regular">{mode === "reveal" ? "階層を順に明らかにする" : "一覧と詳細の連続性を保つ"}</h2>
  </header>

  {#if mode === "reveal"}
    <div class="grid gap-(--space-4) [&>div]:grid [&>div]:min-h-(--space-20) [&>div]:grid-cols-[var(--space-12)_1fr] [&>div]:items-center [&>div]:border-t [&>div]:border-rule">
      <div data-reveal><span class="font-mono text-caption text-quiet">01</span><strong class="text-h3 font-component">Content</strong></div>
      <div data-reveal="line"><span class="font-mono text-caption text-quiet">02</span><strong class="text-h3 font-component">Rule</strong></div>
      <div data-reveal="image"><span class="font-mono text-caption text-quiet">03</span><strong class="text-h3 font-component">Media</strong></div>
    </div>
    <Button type="button" onclick={replayReveal}>Replay reveal</Button>
  {:else}
    <section class="grid min-h-88 content-between border-y border-rule py-(--space-8)" aria-live="polite">
      <p class="m-0 font-mono text-caption text-quiet">Frame / {frame}</p>
      <h3 class="m-0 max-w-[13ch] font-serif text-h2 font-regular">{frame === "index" ? "静かな記録の一覧" : "ひとつの記録を読む"}</h3>
      <div class="h-(--space-4) w-[min(100%,22rem)] bg-support" style:view-transition-name="record-media-story" aria-hidden="true"></div>
    </section>
    <div class="flex flex-wrap items-center gap-(--space-4)">
      <Button type="button" onclick={navigate}>Navigate</Button>
      <output class="font-mono text-caption text-quiet">View transitions: {transitionRuns}</output>
    </div>
  {/if}
</main>
