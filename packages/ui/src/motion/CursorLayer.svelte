<script lang="ts">
  import { onMount } from "svelte";
  import { cursorStates, type CursorState } from "./cursor.ts";

  let enabled = $state(false);
  let cursorMode = $state<CursorState>("default");
  let x = $state(-100);
  let y = $state(-100);
  let nativeCursor = $state(false);

  function cursorState(target: EventTarget | null): CursorState {
    const element = target instanceof Element ? target : null;
    const explicit = element?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
    if (cursorStates.includes(explicit as CursorState)) return explicit as CursorState;
    if (element?.closest("p, h1, h2, h3, h4, blockquote, code, pre, dt, dd")) return "text";
    if (element?.closest("img, video, picture")) return "media";
    if (element?.closest("a, button, select, summary, label")) return "interactive";
    return "default";
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
      nativeCursor = nativeTarget || Boolean(selection && !selection.isCollapsed);
      document.documentElement.toggleAttribute("data-custom-cursor", enabled && !nativeCursor);
    };
    const updateCapability = () => {
      enabled = pointer.matches && !forced.matches && document.documentElement.dataset.motion === "full";
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
      cursorMode = cursorState(event.target);
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
  <div class="cursor" data-state={cursorMode} style:transform={`translate3d(${x}px, ${y}px, 0)`} aria-hidden="true"><span></span></div>
{/if}

<style>
  :global(html[data-custom-cursor] body),
  :global(html[data-custom-cursor] a),
  :global(html[data-custom-cursor] button),
  :global(html[data-custom-cursor] summary),
  :global(html[data-custom-cursor] label) { cursor: none; }
  .cursor { position: fixed; z-index: var(--z-skip-link); top: 0; left: 0; width: var(--space-5); height: var(--space-5); margin: calc(var(--space-5) / -2); border: 1px solid var(--color-foreground); border-radius: var(--radius-round); pointer-events: none; transition: width var(--motion-duration-fast) var(--motion-ease-standard), height var(--motion-duration-fast) var(--motion-ease-standard), margin var(--motion-duration-fast) var(--motion-ease-standard), background var(--motion-duration-fast) var(--motion-ease-standard); }
  .cursor span { position: absolute; top: 50%; left: 50%; width: var(--space-1); height: var(--space-1); border-radius: var(--radius-round); background: var(--color-accent); transform: translate(-50%, -50%); }
  .cursor[data-state="interactive"], .cursor[data-state="media"], .cursor[data-state="webgl"], .cursor[data-state="drag"] { width: var(--space-10); height: var(--space-10); margin: calc(var(--space-10) / -2); background: color-mix(in srgb, var(--color-accent) 14%, transparent); }
  .cursor[data-state="text"] { width: var(--space-1); height: var(--space-6); margin: calc(var(--space-6) / -2) calc(var(--space-1) / -2); border-radius: var(--radius-none); }
</style>
