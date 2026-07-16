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

<main class="motion-preview" data-mode={mode}>
  <header>
    <p>Motion / {mode === "reveal" ? "Reveal" : "Page transition"}</p>
    <h2>{mode === "reveal" ? "階層を順に明らかにする" : "一覧と詳細の連続性を保つ"}</h2>
  </header>

  {#if mode === "reveal"}
    <div class="sequence">
      <div data-reveal><span>01</span><strong>Content</strong></div>
      <div data-reveal="line"><span>02</span><strong>Rule</strong></div>
      <div data-reveal="image"><span>03</span><strong>Media</strong></div>
    </div>
    <Button type="button" onclick={replayReveal}>Replay reveal</Button>
  {:else}
    <section class="transition-frame" aria-live="polite">
      <p>Frame / {frame}</p>
      <h3>{frame === "index" ? "静かな記録の一覧" : "ひとつの記録を読む"}</h3>
      <div class="shared-shape" aria-hidden="true"></div>
    </section>
    <div class="controls">
      <Button type="button" onclick={navigate}>Navigate</Button>
      <output>View transitions: {transitionRuns}</output>
    </div>
  {/if}
</main>

<style>
  .motion-preview {
    display: grid;
    gap: var(--space-10);
    width: min(calc(100% - (2 * var(--layout-gutter))), 64rem);
    margin-inline: auto;
    padding-block: var(--section-space);
  }

  header p,
  .transition-frame p,
  output,
  .sequence span {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  header p,
  h2,
  h3,
  .transition-frame p {
    margin: 0;
  }

  h2 {
    max-width: 16ch;
    margin-top: var(--space-3);
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    font-weight: var(--weight-regular);
    line-height: var(--leading-tight);
  }

  .sequence {
    display: grid;
    gap: var(--space-4);
  }

  .sequence div {
    display: grid;
    min-height: var(--space-20);
    grid-template-columns: var(--space-12) 1fr;
    align-items: center;
    border-top: 1px solid var(--color-line);
  }

  .sequence strong {
    font-size: var(--text-h3);
    font-weight: var(--weight-component);
  }

  .transition-frame {
    display: grid;
    min-height: 22rem;
    align-content: space-between;
    border-block: 1px solid var(--color-line);
    padding-block: var(--space-8);
  }

  .transition-frame h3 {
    max-width: 13ch;
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    font-weight: var(--weight-regular);
    view-transition-name: section-title;
  }

  .shared-shape {
    width: min(100%, 22rem);
    height: var(--space-4);
    background: var(--color-secondary);
    view-transition-name: record-media-story;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
  }
</style>
