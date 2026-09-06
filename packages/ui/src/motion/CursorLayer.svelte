<script lang="ts">
  import { onMount } from "svelte";
  import { cursorStates, type CursorState } from "./cursor.ts";

  let enabled = $state(false);
  let cursorMode = $state<CursorState>("default");
  let x = $state(-100);
  let y = $state(-100);
  let nativeCursor = $state(false);
  let cursorLabel = $state("");

  function cursorState(target: EventTarget | null): {
    state: CursorState;
    label: string;
  } {
    const element = target instanceof Element ? target : null;
    const explicitElement = element?.closest<HTMLElement>(
      "[data-cursor], [data-cursor-label]",
    );
    const explicit = explicitElement?.dataset.cursor;
    const label = explicitElement?.dataset.cursorLabel ?? "";
    if (cursorStates.includes(explicit as CursorState)) {
      return { state: explicit as CursorState, label };
    }
    if (element?.closest(".article-record .prose")) {
      return { state: "reading-text", label };
    }
    if (element?.closest("p, h1, h2, h3, h4, blockquote, code, pre, dt, dd")) {
      return { state: "text", label };
    }
    if (element?.closest("img, video, picture"))
      return { state: "media", label };
    if (element?.closest("a, button, select, summary, label")) {
      return { state: "interactive", label };
    }
    return { state: "default", label };
  }

  onMount(() => {
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const forced = matchMedia("(forced-colors: active)");
    let frame = 0;
    let nextX = -100;
    let nextY = -100;
    let nativeTarget = false;
    const syncCursor = () => {
      const selection = getSelection();
      nativeCursor =
        nativeTarget || Boolean(selection && !selection.isCollapsed);
      document.documentElement.toggleAttribute(
        "data-custom-cursor",
        enabled && !nativeCursor,
      );
    };
    const updateCapability = () => {
      const root = document.documentElement;
      const motion = root.dataset.motion;
      const preference = root.dataset.motionPreference;
      const allowsCustomCursor =
        motion === "full" || (motion === "reduced" && preference === "reduced");
      enabled = pointer.matches && !forced.matches && allowsCustomCursor;
      syncCursor();
    };
    const move = (event: PointerEvent) => {
      if (!enabled) return;
      const element = event.target instanceof Element ? event.target : null;
      nativeTarget = Boolean(
        element?.closest("input, textarea, select, [contenteditable='true']"),
      );
      syncCursor();
      if (nativeCursor) return;
      nextX = event.clientX;
      nextY = event.clientY;
      const cursor = cursorState(event.target);
      cursorMode = cursor.state;
      cursorLabel = cursor.label;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        x = nextX;
        y = nextY;
        frame = 0;
      });
    };
    updateCapability();
    pointer.addEventListener("change", updateCapability);
    forced.addEventListener("change", updateCapability);
    addEventListener("lunacea:motion", updateCapability);
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("selectionchange", syncCursor);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.removeAttribute("data-custom-cursor");
      pointer.removeEventListener("change", updateCapability);
      forced.removeEventListener("change", updateCapability);
      removeEventListener("lunacea:motion", updateCapability);
      removeEventListener("pointermove", move);
      document.removeEventListener("selectionchange", syncCursor);
    };
  });
</script>

{#if enabled && !nativeCursor}
  <div
    class="cursor group/cursor pointer-events-none fixed top-0 left-0 z-(--z-skip-link) size-0 text-ink transform-[translate3d(var(--cursor-x),var(--cursor-y),0)]"
    data-state={cursorMode}
    data-label={cursorLabel || undefined}
    data-has-label={Boolean(cursorLabel)}
    style={`--cursor-x:${x}px;--cursor-y:${y}px`}
    aria-hidden="true"
  >
    <span class="cursor-shape absolute top-0 left-0 grid size-(--space-5) -translate-1/2 origin-center animate-cursor-square-spin place-items-center overflow-hidden rounded-none border-(length:--cursor-stroke-width) border-ink bg-transparent text-inherit transition-[width,height,translate,background] duration-(--motion-duration-base) ease-enter group-data-[has-label=false]/cursor:group-data-[state=interactive]/cursor:size-(--space-6) group-data-[has-label=false]/cursor:group-data-[state=interactive]/cursor:animate-cursor-settle-diamond group-data-[has-label=false]/cursor:group-data-[state=media]/cursor:size-(--space-6) group-data-[has-label=false]/cursor:group-data-[state=media]/cursor:animate-cursor-settle-diamond group-data-[has-label=false]/cursor:group-data-[state=webgl]/cursor:size-(--space-6) group-data-[has-label=false]/cursor:group-data-[state=webgl]/cursor:animate-cursor-settle-diamond group-data-[has-label=false]/cursor:group-data-[state=drag]/cursor:size-(--space-6) group-data-[has-label=false]/cursor:group-data-[state=drag]/cursor:animate-cursor-settle-diamond group-data-[has-label=false]/cursor:group-data-[state=reading-text]/cursor:h-(--space-6) group-data-[has-label=false]/cursor:group-data-[state=reading-text]/cursor:w-0 group-data-[has-label=false]/cursor:group-data-[state=reading-text]/cursor:animate-cursor-settle-text group-data-[has-label=false]/cursor:group-data-[state=reading-text]/cursor:border-y-0 group-data-[has-label=false]/cursor:group-data-[state=reading-text]/cursor:border-r-(length:--cursor-stroke-width) group-data-[has-label=false]/cursor:group-data-[state=reading-text]/cursor:border-l-0 group-data-[has-label=true]/cursor:h-[calc(var(--space-8)+var(--space-1))] group-data-[has-label=true]/cursor:w-[calc(var(--space-24)+var(--space-4))] group-data-[has-label=true]/cursor:translate-(--space-2) group-data-[has-label=true]/cursor:animate-cursor-settle-square group-data-[has-label=true]/cursor:bg-[color-mix(in_srgb,var(--color-background)_92%,transparent)] group-data-[has-label=true]/cursor:px-(--space-3) group-data-[label='View_more']/cursor:before:absolute group-data-[label='View_more']/cursor:before:inset-0 group-data-[label='View_more']/cursor:before:z-(--z-base) group-data-[label='View_more']/cursor:before:animate-cursor-view-more-fill group-data-[label='View_more']/cursor:before:bg-[linear-gradient(118deg,transparent_0_28%,var(--color-accent)_28%_72%,transparent_72%_100%)] group-data-[label='View_more']/cursor:before:bg-size-[calc(var(--space-32)+var(--space-16)+var(--space-4))_100%] group-data-[label='View_more']/cursor:before:bg-repeat-x group-data-[label='View_more']/cursor:before:content-[''] group-data-[label='Read_more']/cursor:before:absolute group-data-[label='Read_more']/cursor:before:inset-0 group-data-[label='Read_more']/cursor:before:z-(--z-base) group-data-[label='Read_more']/cursor:before:animate-cursor-view-more-fill group-data-[label='Read_more']/cursor:before:bg-[linear-gradient(118deg,transparent_0_28%,var(--color-accent)_28%_72%,transparent_72%_100%)] group-data-[label='Read_more']/cursor:before:bg-size-[calc(var(--space-32)+var(--space-16)+var(--space-4))_100%] group-data-[label='Read_more']/cursor:before:bg-repeat-x group-data-[label='Read_more']/cursor:before:content-['']">
      {#if cursorLabel}<span class="cursor-label absolute inset-0 z-(--z-content) grid place-items-center whitespace-nowrap font-sans text-caption font-emphasis tracking-ui"><span class="cursor-label-mask absolute inset-0 grid place-items-center theme-dark:group-data-[label='View_more']/cursor:animate-cursor-view-more-fill theme-dark:group-data-[label='View_more']/cursor:bg-[linear-gradient(118deg,var(--color-foreground)_0_28%,var(--color-black)_28%_72%,var(--color-foreground)_72%_100%)] theme-dark:group-data-[label='View_more']/cursor:bg-size-[calc(var(--space-32)+var(--space-16)+var(--space-4))_100%] theme-dark:group-data-[label='View_more']/cursor:bg-repeat-x theme-dark:group-data-[label='View_more']/cursor:bg-clip-text theme-dark:group-data-[label='View_more']/cursor:text-transparent theme-dark:group-data-[label='Read_more']/cursor:animate-cursor-view-more-fill theme-dark:group-data-[label='Read_more']/cursor:bg-[linear-gradient(118deg,var(--color-foreground)_0_28%,var(--color-black)_28%_72%,var(--color-foreground)_72%_100%)] theme-dark:group-data-[label='Read_more']/cursor:bg-size-[calc(var(--space-32)+var(--space-16)+var(--space-4))_100%] theme-dark:group-data-[label='Read_more']/cursor:bg-repeat-x theme-dark:group-data-[label='Read_more']/cursor:bg-clip-text theme-dark:group-data-[label='Read_more']/cursor:text-transparent">{cursorLabel}</span></span>{/if}
    </span>
  </div>
{/if}
