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
    class="cursor"
    class:has-label={Boolean(cursorLabel)}
    data-state={cursorMode}
    data-label={cursorLabel || undefined}
    style:transform={`translate3d(${x}px, ${y}px, 0)`}
    aria-hidden="true"
  >
    <span class="cursor-shape">
      {#if cursorLabel}<span class="cursor-message">{cursorLabel}</span>{/if}
    </span>
  </div>
{/if}

<style>
  :global(html[data-custom-cursor] body),
  :global(html[data-custom-cursor] a),
  :global(html[data-custom-cursor] button),
  :global(html[data-custom-cursor] summary),
  :global(html[data-custom-cursor] label),
  :global(html[data-custom-cursor] .article-record .prose) {
    cursor: none;
  }
  .cursor {
    position: fixed;
    z-index: var(--z-skip-link);
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    color: var(--color-foreground);
    pointer-events: none;
  }

  .cursor-shape {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    width: var(--space-5);
    height: var(--space-5);
    place-items: center;
    overflow: hidden;
    border: var(--cursor-stroke-width) solid var(--color-foreground);
    border-radius: var(--radius-none);
    background: transparent;
    color: inherit;
    translate: -50% -50%;
    transform-origin: center;
    animation: cursor-square-spin calc(var(--motion-duration-opening) * 1.4)
      linear infinite;
    transition:
      width var(--motion-duration-base) var(--motion-ease-enter),
      height var(--motion-duration-base) var(--motion-ease-enter),
      translate var(--motion-duration-fast) var(--motion-ease-standard),
      background var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .cursor:not(.has-label)[data-state="interactive"] .cursor-shape,
  .cursor:not(.has-label)[data-state="media"] .cursor-shape,
  .cursor:not(.has-label)[data-state="webgl"] .cursor-shape,
  .cursor:not(.has-label)[data-state="drag"] .cursor-shape {
    width: var(--space-6);
    height: var(--space-6);
    background: transparent;
    animation: cursor-settle-diamond var(--motion-duration-fast)
      var(--motion-ease-enter) both;
  }

  .cursor:not(.has-label)[data-state="reading-text"] .cursor-shape {
    width: 0;
    height: var(--space-6);
    border-style: solid;
    border-color: var(--color-foreground);
    border-width: 0 var(--cursor-stroke-width) 0 0;
    background: transparent;
    animation: cursor-settle-text var(--motion-duration-fast)
      var(--motion-ease-enter) both;
  }

  .cursor.has-label .cursor-shape {
    width: calc(var(--space-24) + var(--space-4));
    height: calc(var(--space-8) + var(--space-1));
    padding-inline: var(--space-3);
    background: color-mix(in srgb, var(--color-background) 92%, transparent);
    translate: var(--space-2) var(--space-2);
    animation: cursor-settle-square var(--motion-duration-fast)
      var(--motion-ease-enter) both;
    transition-delay: var(--motion-duration-fast), var(--motion-duration-fast),
      0ms, var(--motion-duration-fast);
  }

  .cursor-message {
    position: relative;
    z-index: var(--z-content);
    opacity: 0;
    font-family: var(--font-sans);
    font-size: var(--text-caption);
    font-weight: var(--weight-emphasis);
    letter-spacing: var(--tracking-ui);
    white-space: nowrap;
    animation: cursor-message-enter var(--motion-duration-fast)
      var(--motion-ease-enter) var(--motion-duration-base) both;
  }

  .cursor[data-label="View more"] .cursor-shape::before {
    position: absolute;
    z-index: var(--z-base);
    inset: 0;
    background: linear-gradient(
      118deg,
      transparent 0 28%,
      color-mix(in srgb, var(--color-accent) 78%, transparent) 28% 72%,
      transparent 72% 100%
    );
    background-position: 0 0;
    background-repeat: repeat-x;
    /* The transparent gap stays wider than the expanded cursor, so two bands never appear. */
    background-size: calc(var(--space-32) + var(--space-16) + var(--space-4))
      100%;
    content: "";
    animation: cursor-view-more-fill 2400ms linear var(--motion-duration-base)
      infinite;
  }

  @keyframes cursor-square-spin {
    to {
      rotate: 360deg;
    }
  }

  @keyframes cursor-settle-diamond {
    from {
      rotate: 0deg;
    }
    to {
      rotate: 45deg;
    }
  }

  @keyframes cursor-settle-square {
    from {
      rotate: 45deg;
    }
    to {
      rotate: 0deg;
    }
  }

  @keyframes cursor-settle-text {
    0% {
      width: var(--space-5);
      height: var(--space-5);
      border-width: var(--cursor-stroke-width);
      rotate: 45deg;
    }
    55% {
      width: var(--space-5);
      height: var(--space-5);
      border-width: var(--cursor-stroke-width);
      rotate: 0deg;
    }
    100% {
      width: 0;
      height: var(--space-6);
      border-width: 0 var(--cursor-stroke-width) 0 0;
      rotate: 0deg;
    }
  }

  @keyframes cursor-message-enter {
    to {
      opacity: 1;
    }
  }

  @keyframes cursor-view-more-fill {
    from {
      background-position: 0 0;
    }
    to {
      background-position: calc(
          var(--space-32) + var(--space-16) + var(--space-4)
        )
        0;
    }
  }
</style>
