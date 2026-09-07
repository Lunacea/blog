<script lang="ts">
  import { onMount } from "svelte";

  // Home has only two snap sections. This threshold is intentionally below a typical mouse-wheel
  // notch while still filtering trackpad noise; it is not a reusable design-system dimension.
  const wheelThreshold = 36;
  const gestureResetMs = 180;
  const boundaryTolerance = 24;

  function hasScrollableAncestor(target: EventTarget | null, direction: number) {
    let element = target instanceof Element ? target : null;
    while (element && element !== document.documentElement) {
      const style = getComputedStyle(element);
      if (/(auto|scroll)/u.test(style.overflowY)) {
        const canScrollUp = element.scrollTop > 0;
        const canScrollDown = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
        if ((direction < 0 && canScrollUp) || (direction > 0 && canScrollDown)) return true;
      }
      element = element.parentElement;
    }
    return false;
  }

  onMount(() => {
    const intro = document.querySelector<HTMLElement>("[data-home-intro]");
    const about = document.querySelector<HTMLElement>("[data-home-about]");
    if (!intro || !about) return;

    let accumulated = 0;
    let previousDirection = 0;
    let previousTime = 0;
    let locked = false;
    let unlockTimer = 0;

    const unlock = () => {
      locked = false;
      unlockTimer = 0;
    };

    const moveTo = (target: HTMLElement) => {
      locked = true;
      const fullMotion = document.documentElement.dataset.motion === "full" &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "start", behavior: fullMotion ? "smooth" : "auto" });
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(unlock, fullMotion ? 650 : 120);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY) return;
      const direction = Math.sign(event.deltaY);
      if (hasScrollableAncestor(event.target, direction)) return;
      if (locked) {
        event.preventDefault();
        return;
      }

      const aboutTop = about.offsetTop;
      const atOpening = scrollY < aboutTop - boundaryTolerance;
      const atAboutStart = Math.abs(scrollY - aboutTop) <= boundaryTolerance;
      if ((direction > 0 && !atOpening) || (direction < 0 && !atAboutStart)) return;

      const now = performance.now();
      if (direction !== previousDirection || now - previousTime > gestureResetMs) accumulated = 0;
      previousDirection = direction;
      previousTime = now;
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? innerHeight
        : 1;
      accumulated += event.deltaY * unit;
      if (Math.abs(accumulated) < wheelThreshold) return;

      event.preventDefault();
      accumulated = 0;
      moveTo(direction > 0 ? about : intro);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(unlockTimer);
      window.removeEventListener("wheel", onWheel);
    };
  });
</script>
