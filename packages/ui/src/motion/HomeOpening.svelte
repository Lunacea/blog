<script lang="ts">
  import { onMount } from "svelte";

  let active = $state(false);

  onMount(() => {
    const root = document.documentElement;
    const key = "lunacea-home-opening";
    const pending = root.dataset.homeOpening === "pending";
    if (!pending && (root.dataset.motion !== "full" || sessionStorage.getItem(key))) return;
    sessionStorage.setItem(key, "started");
    root.dataset.homeOpening = "active";
    active = true;
    const complete = window.setTimeout(() => {
      active = false;
      delete root.dataset.homeOpening;
    }, 1800);
    return () => {
      clearTimeout(complete);
      active = false;
      delete root.dataset.homeOpening;
    };
  });
</script>

{#if active}
  <div class="pointer-events-none fixed inset-0 z-(--z-progress) grid animate-home-opening-exit place-content-center gap-4" aria-hidden="true">
    <span class="font-editorial text-(length:--text-h3) tracking-(--tracking-display)">Lunacea</span><i class="block h-px w-28 overflow-hidden bg-rule after:block after:size-full after:origin-left after:animate-home-opening-line after:bg-ink after:content-['']"></i>
  </div>
{/if}
