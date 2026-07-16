<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";

  let observer: IntersectionObserver | null = null;

  function prepare() {
    observer?.disconnect();
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];

    if (root.dataset.motion !== "full") {
      delete root.dataset.revealReady;
      for (const target of targets) target.dataset.visible = "true";
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.visible = "true";
          observer?.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    for (const target of targets) {
      if (target.getBoundingClientRect().top < window.innerHeight * 0.92) {
        target.dataset.visible = "true";
      } else {
        delete target.dataset.visible;
        observer.observe(target);
      }
    }
    root.dataset.revealReady = "true";
  }

  afterNavigate(() => queueMicrotask(prepare));

  onMount(() => {
    const handleMotion = () => prepare();
    window.addEventListener("lunacea:motion", handleMotion);
    const root = document.documentElement;
    const openingKey = "lunacea-home-opening";
    if (location.pathname === "/" && root.dataset.motion === "full" && !sessionStorage.getItem(openingKey)) {
      sessionStorage.setItem(openingKey, "shown");
      root.dataset.homeOpening = "true";
      window.setTimeout(() => delete root.dataset.homeOpening, 1200);
    }
    prepare();
    return () => {
      observer?.disconnect();
      delete document.documentElement.dataset.revealReady;
      window.removeEventListener("lunacea:motion", handleMotion);
    };
  });
</script>
