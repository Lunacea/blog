<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";

  let observer: IntersectionObserver | null = null;
  let parallaxObserver: IntersectionObserver | null = null;
  let parallaxTargets = new Set<HTMLElement>();
  let frame = 0;

  function parallaxAllowed() {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return document.documentElement.dataset.motion === "full" && !document.hidden &&
      !connection?.saveData && !matchMedia("(forced-colors: active)").matches;
  }

  function updateParallax() {
    frame = 0;
    if (!parallaxAllowed()) {
      for (const target of parallaxTargets) target.style.removeProperty("--reveal-parallax");
      return;
    }
    const maximum = innerWidth <= 704 ? 8 : 16;
    for (const target of parallaxTargets) {
      const bounds = target.getBoundingClientRect();
      const progress = (bounds.top + bounds.height / 2 - innerHeight / 2) /
        Math.max(innerHeight, bounds.height);
      target.style.setProperty("--reveal-parallax", `${Math.max(-maximum, Math.min(maximum, -progress * maximum * 2))}px`);
    }
  }

  function scheduleParallax() {
    if (!frame) frame = requestAnimationFrame(updateParallax);
  }

  function prepare() {
    observer?.disconnect();
    parallaxObserver?.disconnect();
    parallaxTargets.clear();
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];

    if (root.dataset.motion !== "full") {
      delete root.dataset.revealReady;
      for (const target of targets) target.dataset.visible = "true";
      for (const target of targets) {
        target.style.removeProperty("--reveal-delay");
        target.style.removeProperty("--reveal-parallax");
      }
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

    parallaxObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) parallaxTargets.add(target);
        else {
          parallaxTargets.delete(target);
          target.style.removeProperty("--reveal-parallax");
        }
      }
      scheduleParallax();
    }, { rootMargin: "20% 0px" });

    for (const [index, target] of targets.entries()) {
      target.style.setProperty("--reveal-delay", `${Math.min(index % 7, 6) * 40}ms`);
      if (target.getBoundingClientRect().top < window.innerHeight * 0.92) {
        target.dataset.visible = "true";
      } else {
        delete target.dataset.visible;
        observer.observe(target);
      }
      if (target.dataset.reveal === "image" || target.dataset.reveal === "media") {
        parallaxObserver.observe(target);
      }
    }
    root.dataset.revealReady = "true";
    scheduleParallax();
  }

  afterNavigate(() => queueMicrotask(prepare));

  onMount(() => {
    const handleMotion = () => prepare();
    const handleVisibility = () => scheduleParallax();
    window.addEventListener("lunacea:motion", handleMotion);
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax);
    document.addEventListener("visibilitychange", handleVisibility);
    prepare();
    return () => {
      observer?.disconnect();
      parallaxObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      delete document.documentElement.dataset.revealReady;
      window.removeEventListener("lunacea:motion", handleMotion);
      window.removeEventListener("scroll", scheduleParallax);
      window.removeEventListener("resize", scheduleParallax);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  });
</script>
