<script lang="ts">
  import { onMount } from "svelte";
  import { resetNavigationMocks, simulateNavigation } from "$app/navigation";
  import { installPageTransitions } from "./page-transitions.ts";

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

  const navigate = () =>
    simulateNavigation(() => {
      frame = frame === "index" ? "detail" : "index";
    });
</script>

<main
  class="motion-preview mx-auto grid w-[min(calc(100%-(2*var(--layout-gutter))),64rem)] gap-(--space-10) py-(--section-space)"
>
  <header>
    <p class="m-0 font-mono text-caption text-quiet">Motion / Page transition</p>
    <h2 class="mt-(--space-3) max-w-[16ch] font-serif text-h2 leading-tight font-regular">
      一覧と詳細の連続性を保つ
    </h2>
  </header>

  <section class="grid min-h-88 content-between border-y border-rule py-(--space-8)" aria-live="polite">
    <p class="m-0 font-mono text-caption text-quiet">Frame / {frame}</p>
    <h3 class="m-0 max-w-[13ch] font-serif text-h2 font-regular">
      {frame === "index" ? "静かな記録の一覧" : "ひとつの記録を読む"}
    </h3>
    <div
      class="h-(--space-4) w-[min(100%,22rem)] bg-support"
      style:view-transition-name="record-media-story"
      aria-hidden="true"
    ></div>
  </section>

  <div class="flex flex-wrap items-center gap-(--space-4)">
    <button
      class="inline-flex min-h-control cursor-pointer items-center rounded-ui-card border border-rule px-(--space-4) font-stretch-84% text-folio tracking-folio text-ink uppercase pressable hover:border-ink focus-visible:border-ink"
      type="button"
      onclick={() => void navigate()}
    >Navigate</button>
    <output class="font-mono text-caption text-quiet">View transitions: {transitionRuns}</output>
  </div>
</main>
