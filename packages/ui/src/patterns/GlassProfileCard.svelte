<script lang="ts">
  import { onMount } from "svelte";
  import type { AuthoredMedia } from "@lunacea/config";
  import { Icon, socialIcons } from "../icons";
  import MediaSlot from "../visuals/MediaSlot.svelte";

  let {
    asset,
    name,
    field,
    github = null,
    x = null,
    email = null,
  }: {
    asset: AuthoredMedia;
    name: string;
    field: string;
    github?: string | null;
    x?: string | null;
    email?: string | null;
  } = $props();

  const emailHref = $derived(
    email ? (email.startsWith("mailto:") ? email : `mailto:${email}`) : null,
  );
  const roles = $derived(
    field
      .split(/\s+\/\s+|,\s*|\s+·\s+/u)
      .map((role) => role.trim())
      .filter(Boolean)
      .slice(0, 2),
  );

  let card: HTMLElement;
  let surface: HTMLElement;
  let pointerId: number | null = null;
  let dragging = $state(false);
  let pointerIntent: "idle" | "pending" | "drag" | "scroll" = "idle";
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTime = 0;
  let velocityX = 0;
  let velocityY = 0;
  let coarseDrag = false;
  let originX = 0;
  let originY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let pendingX = 0;
  let pendingY = 0;
  let dragFrame = 0;
  let tiltFrame = 0;
  let inertiaFrame = 0;
  let inertial = $state(false);
  let introduced = $state(false);

  function motionIsFull() {
    return document.documentElement.dataset.motion === "full" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isDragOrigin(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return !target.closest("a, button, input, textarea, select, [contenteditable]");
  }

  function clamp(value: number, minimum: number, maximum: number) {
    return minimum > maximum ? (minimum + maximum) / 2 : Math.max(minimum, Math.min(maximum, value));
  }

  function rotationAroundRestingTilt(delta: number) {
    return `calc(var(--profile-card-resting-tilt) + ${delta.toFixed(2)}deg)`;
  }

  function offsetBounds() {
    const boundary = card.closest<HTMLElement>("[data-profile-boundary]") ?? card.parentElement;
    if (!boundary) return null;
    const cardRect = card.getBoundingClientRect();
    const boundaryRect = boundary.getBoundingClientRect();
    const boundaryStyle = getComputedStyle(boundary);
    const baseLeft = cardRect.left - offsetX;
    const baseTop = cardRect.top - offsetY;
    const minimumX = boundaryRect.left + parseFloat(boundaryStyle.paddingLeft) - baseLeft;
    const maximumX = boundaryRect.right - parseFloat(boundaryStyle.paddingRight) -
      (baseLeft + cardRect.width);
    const minimumY = boundaryRect.top + parseFloat(boundaryStyle.paddingTop) - baseTop;
    const maximumY = boundaryRect.bottom - parseFloat(boundaryStyle.paddingBottom) -
      (baseTop + cardRect.height);
    return { minimumX, maximumX, minimumY, maximumY };
  }

  function clampOffset(x: number, y: number) {
    const bounds = offsetBounds();
    if (!bounds) return { x, y };
    return {
      x: clamp(x, bounds.minimumX, bounds.maximumX),
      y: clamp(y, bounds.minimumY, bounds.maximumY),
    };
  }

  function overshootLimit() {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--space-6");
    return Number.parseFloat(value) || 24;
  }

  function rubberBand(value: number, minimum: number, maximum: number) {
    const limit = overshootLimit();
    if (value < minimum) {
      return minimum - limit * (1 - Math.exp(-(minimum - value) / limit));
    }
    if (value > maximum) {
      return maximum + limit * (1 - Math.exp(-(value - maximum) / limit));
    }
    return value;
  }

  function elasticOffset(x: number, y: number) {
    const bounds = offsetBounds();
    if (!bounds) return { x, y };
    return {
      x: rubberBand(x, bounds.minimumX, bounds.maximumX),
      y: rubberBand(y, bounds.minimumY, bounds.maximumY),
    };
  }

  function applyOffset(x: number, y: number) {
    offsetX = x;
    offsetY = y;
    card.style.setProperty("--card-x", `${offsetX.toFixed(2)}px`);
    card.style.setProperty("--card-y", `${offsetY.toFixed(2)}px`);
  }

  function commitDrag() {
    dragFrame = 0;
    const next = motionIsFull()
      ? elasticOffset(pendingX, pendingY)
      : clampOffset(pendingX, pendingY);
    applyOffset(next.x, next.y);
  }

  function startDrag(event: PointerEvent) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (!isDragOrigin(event.target)) return;
    introduced = false;
    stopInertia();
    pointerId = event.pointerId;
    pointerIntent = "pending";
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerTime = event.timeStamp;
    coarseDrag = event.pointerType === "touch" || matchMedia("(pointer: coarse)").matches;
    velocityX = 0;
    velocityY = 0;
    originX = offsetX;
    originY = offsetY;
  }

  function moveDrag(event: PointerEvent) {
    if (pointerId !== event.pointerId || pointerIntent === "idle" || pointerIntent === "scroll") {
      updateTilt(event);
      return;
    }
    const fromStartX = event.clientX - pointerStartX;
    const fromStartY = event.clientY - pointerStartY;
    if (pointerIntent === "pending" && Math.hypot(fromStartX, fromStartY) > 7) {
      const isCoarse = event.pointerType === "touch" ||
        matchMedia("(pointer: coarse)").matches;
      if (isCoarse && Math.abs(fromStartY) > Math.abs(fromStartX) * 1.25) {
        pointerIntent = "idle";
        pointerId = null;
        return;
      }
      pointerIntent = "drag";
      dragging = true;
    }
    if (pointerIntent !== "drag") return;
    event.preventDefault();
    pendingX = originX + fromStartX;
    pendingY = originY + fromStartY;
    const elapsed = Math.max(8, event.timeStamp - pointerTime);
    const horizontalDelta = event.clientX - pointerX;
    const verticalDelta = event.clientY - pointerY;
    velocityX = clamp(velocityX * .5 + horizontalDelta / elapsed * .5, -1.05, 1.05);
    velocityY = clamp(velocityY * .5 + verticalDelta / elapsed * .5, -1.05, 1.05);
    if (motionIsFull() && event.pointerType !== "touch") {
      surface.style.setProperty(
        "--card-rotate-x",
        `${clamp(-verticalDelta * .16, -1.5, 1.5).toFixed(2)}deg`,
      );
      surface.style.setProperty(
        "--card-rotate-y",
        `${clamp(horizontalDelta * .16, -1.5, 1.5).toFixed(2)}deg`,
      );
    }
    if (motionIsFull()) {
      surface.style.setProperty(
        "--card-rotate-z",
        rotationAroundRestingTilt(clamp(horizontalDelta * .05, -1.2, 1.2)),
      );
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerTime = event.timeStamp;
    if (!dragFrame) dragFrame = requestAnimationFrame(commitDrag);
  }

  function stopDrag(event: PointerEvent) {
    if (pointerId !== event.pointerId && pointerIntent !== "drag") return;
    if (dragFrame) {
      cancelAnimationFrame(dragFrame);
      commitDrag();
    }
    const wasDragging = pointerIntent === "drag";
    dragging = false;
    pointerId = null;
    pointerIntent = "idle";
    if (wasDragging && motionIsFull()) startInertia();
    else resetTilt();
  }

  function startInertia() {
    const speed = Math.hypot(velocityX, velocityY);
    const settled = clampOffset(offsetX, offsetY);
    const boundaryDistance = Math.hypot(settled.x - offsetX, settled.y - offsetY);
    if (speed < .035 && boundaryDistance < .5) {
      stopInertia();
      return;
    }
    inertial = true;
    const started = performance.now();
    let previous = started;
    const step = (now: number) => {
      if (!motionIsFull()) {
        stopInertia();
        return;
      }
      const elapsed = Math.min(32, now - previous);
      previous = now;
      const bounds = offsetBounds();
      if (!bounds) {
        applyOffset(offsetX + velocityX * elapsed, offsetY + velocityY * elapsed);
      } else {
        const springScale = elapsed / 16;
        const targetX = clamp(offsetX, bounds.minimumX, bounds.maximumX);
        const targetY = clamp(offsetY, bounds.minimumY, bounds.maximumY);
        velocityX += (targetX - offsetX) * .022 * springScale;
        velocityY += (targetY - offsetY) * .022 * springScale;
        const candidateX = offsetX + velocityX * elapsed;
        const candidateY = offsetY + velocityY * elapsed;
        const limit = overshootLimit();
        const nextX = clamp(
          candidateX,
          bounds.minimumX - limit,
          bounds.maximumX + limit,
        );
        const nextY = clamp(
          candidateY,
          bounds.minimumY - limit,
          bounds.maximumY + limit,
        );
        if (nextX !== candidateX) velocityX *= -.34;
        if (nextY !== candidateY) velocityY *= -.34;
        applyOffset(nextX, nextY);
      }
      if (!coarseDrag) {
        surface.style.setProperty(
          "--card-rotate-x",
          `${clamp(-velocityY * 1.8, -1.1, 1.1).toFixed(2)}deg`,
        );
        surface.style.setProperty(
          "--card-rotate-y",
          `${clamp(velocityX * 1.8, -1.1, 1.1).toFixed(2)}deg`,
        );
      }
      surface.style.setProperty(
        "--card-rotate-z",
        rotationAroundRestingTilt(clamp(velocityX * 2.6, -1.8, 1.8)),
      );
      const damping = Math.pow(.86, elapsed / 16);
      velocityX *= damping;
      velocityY *= damping;
      const settled = clampOffset(offsetX, offsetY);
      const boundaryDistance = Math.hypot(settled.x - offsetX, settled.y - offsetY);
      if (
        now - started > 3600 ||
        (Math.hypot(velocityX, velocityY) < .018 && boundaryDistance < .5)
      ) {
        stopInertia();
        return;
      }
      inertiaFrame = requestAnimationFrame(step);
    };
    inertiaFrame = requestAnimationFrame(step);
  }

  function stopInertia() {
    cancelAnimationFrame(inertiaFrame);
    inertiaFrame = 0;
    inertial = false;
    velocityX = 0;
    velocityY = 0;
    if (card) {
      const next = clampOffset(offsetX, offsetY);
      applyOffset(next.x, next.y);
    }
    if (surface) resetTilt();
  }

  function updateTilt(event: PointerEvent) {
    if (pointerIntent !== "idle" || !motionIsFull()) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const horizontal = (event.clientX - rect.left) / rect.width - .5;
      const vertical = (event.clientY - rect.top) / rect.height - .5;
      surface.style.setProperty("--card-rotate-x", `${(-vertical * 3).toFixed(2)}deg`);
      surface.style.setProperty("--card-rotate-y", `${(horizontal * 3).toFixed(2)}deg`);
      surface.style.setProperty("--card-light-x", `${((horizontal + .5) * 100).toFixed(1)}%`);
      surface.style.setProperty("--card-light-y", `${((vertical + .5) * 100).toFixed(1)}%`);
    });
  }

  function resetTilt() {
    cancelAnimationFrame(tiltFrame);
    surface.style.removeProperty("--card-rotate-x");
    surface.style.removeProperty("--card-rotate-y");
    surface.style.removeProperty("--card-rotate-z");
    surface.style.removeProperty("--card-light-x");
    surface.style.removeProperty("--card-light-y");
  }

  function finishIntroduction(event: AnimationEvent) {
    if (event.animationName === "profile-card-arrive") introduced = false;
  }

  function keepInBounds() {
    stopInertia();
    cancelAnimationFrame(dragFrame);
    dragFrame = requestAnimationFrame(() => {
      pendingX = offsetX;
      pendingY = offsetY;
      commitDrag();
    });
  }

  onMount(() => {
    const boundary = card.closest<HTMLElement>("[data-profile-boundary]") ?? card.parentElement;
    const resizeObserver = new ResizeObserver(keepInBounds);
    const introductionObserver = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      introduced = motionIsFull();
      introductionObserver.disconnect();
    }, { threshold: .35 });
    resizeObserver.observe(card);
    if (boundary) resizeObserver.observe(boundary);
    introductionObserver.observe(card);
    card.addEventListener("pointerdown", startDrag);
    card.addEventListener("pointerup", stopDrag);
    card.addEventListener("pointercancel", stopDrag);
    card.addEventListener("pointerleave", resetTilt);
    window.addEventListener("resize", keepInBounds);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      cancelAnimationFrame(dragFrame);
      cancelAnimationFrame(tiltFrame);
      cancelAnimationFrame(inertiaFrame);
      resizeObserver.disconnect();
      introductionObserver.disconnect();
      card.removeEventListener("pointerdown", startDrag);
      card.removeEventListener("pointerup", stopDrag);
      card.removeEventListener("pointercancel", stopDrag);
      card.removeEventListener("pointerleave", resetTilt);
      window.removeEventListener("resize", keepInBounds);
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  });
</script>

<article
  class="profile-card"
  class:dragging
  class:inertial
  class:introduced
  data-dragging={dragging}
  data-inertial={inertial}
  data-cursor="drag"
  data-cursor-label="Drag it!"
  bind:this={card}
>
  <div
    class="card-surface"
    bind:this={surface}
    onanimationend={finishIntroduction}
  >
    <header class="identity">
      <div class="profile-media">
        <MediaSlot {asset} showPlaceholder={!asset.src} label="Profile character / replace" />
      </div>
      <div class="identity-copy">
        <h2 id="about-title">{name}</h2>
        <p class="roles">
          {#each roles as role}
            <span>{role}</span>
          {/each}
        </p>
      </div>
    </header>

    <nav class="contact-list" aria-label="連絡先">
      {#if github}
        <a href={github} rel="me" data-cursor="interactive">
          <span class="contact-icon"><Icon name={socialIcons.github} /></span>
          <span>GitHub</span>
        </a>
      {:else}
        <span class="contact-row unavailable">
          <span class="contact-icon"><Icon name={socialIcons.github} /></span>
          <span>GitHub 未設定</span>
        </span>
      {/if}
      {#if x}
        <a href={x} rel="me" data-cursor="interactive">
          <span class="contact-icon"><Icon name={socialIcons.x} /></span>
          <span>X</span>
        </a>
      {:else}
        <span class="contact-row unavailable">
          <span class="contact-icon"><Icon name={socialIcons.x} /></span>
          <span>X 未設定</span>
        </span>
      {/if}
      {#if emailHref}
        <a href={emailHref} data-cursor="interactive">
          <span class="contact-icon email-icon"><Icon name={socialIcons.email} /></span>
          <span>Email</span>
        </a>
      {:else}
        <span class="contact-row unavailable">
          <span class="contact-icon email-icon"><Icon name={socialIcons.email} /></span>
          <span>Email 未設定</span>
        </span>
      {/if}
    </nav>
  </div>
</article>

<style>
  .profile-card {
    --card-x: 0px;
    --card-y: 0px;
    position: relative;
    width: min(var(--profile-card-width), calc(100vw - (var(--layout-gutter) * 2)));
    max-width: var(--layout-grid-wide);
    touch-action: pan-y;
    transform: translate3d(var(--card-x), var(--card-y), 0);
  }

  .card-surface {
    --card-rotate-x: 0deg;
    --card-rotate-y: 0deg;
    --card-rotate-z: var(--profile-card-resting-tilt);
    --card-light-x: 50%;
    --card-light-y: 50%;
    display: grid;
    gap: var(--profile-card-gap);
    overflow: hidden;
    padding: var(--profile-card-padding);
    border-radius: var(--radius-small);
    background:
      radial-gradient(
        circle at var(--card-light-x) var(--card-light-y),
        color-mix(in srgb, var(--color-white) 13%, transparent),
        transparent 42%
      ),
      var(--color-glass);
    box-shadow: var(--shadow-profile);
    backdrop-filter: blur(var(--glass-blur));
    transform:
      perspective(60rem)
      rotateX(var(--card-rotate-x))
      rotateY(var(--card-rotate-y))
      rotateZ(var(--card-rotate-z));
    transform-style: preserve-3d;
    transform-origin: 48% 52%;
    transition: transform var(--motion-duration-fast) var(--motion-ease-enter);
  }

  .profile-card.introduced .card-surface {
    animation: profile-card-arrive var(--motion-duration-opening) var(--motion-ease-enter) 1;
  }

  .profile-card.dragging .card-surface {
    transform:
      perspective(60rem)
      rotateX(var(--card-rotate-x))
      rotateY(var(--card-rotate-y))
      rotateZ(var(--card-rotate-z))
      scale(1.012);
    animation: none;
    transition: none;
  }

  .profile-card.inertial .card-surface {
    transform:
      perspective(60rem)
      rotateX(var(--card-rotate-x))
      rotateY(var(--card-rotate-y))
      rotateZ(var(--card-rotate-z))
      scale(1.006);
    animation: none;
  }

  @keyframes profile-card-arrive {
    0% {
      opacity: 0;
      transform:
        perspective(60rem)
        rotateX(4deg)
        rotateY(-7deg)
        rotateZ(-14deg)
        scale(.96);
    }
    58% {
      opacity: 1;
      transform:
        perspective(60rem)
        rotateX(-1deg)
        rotateY(2deg)
        rotateZ(2.5deg)
        scale(1.008);
    }
    100% {
      opacity: 1;
      transform:
        perspective(60rem)
        rotateX(var(--card-rotate-x))
        rotateY(var(--card-rotate-y))
        rotateZ(var(--card-rotate-z));
    }
  }

  .identity {
    display: grid;
    grid-template-columns: var(--profile-card-media) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3);
  }

  .profile-media {
    width: var(--profile-card-media);
    cursor: grab;
    user-select: none;
  }

  .profile-card.dragging .profile-media {
    cursor: grabbing;
  }

  :global(.profile-media .media-slot),
  :global(.profile-media [data-asset-placeholder]) {
    aspect-ratio: 1;
    border-radius: var(--radius-none);
  }

  :global(.profile-media img) {
    object-fit: contain;
    filter: none;
  }

  .identity-copy {
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
    line-height: var(--leading-snug);
  }

  .identity-copy .roles {
    display: grid;
    overflow: hidden;
    margin: var(--space-1) 0 0;
    color: var(--color-muted);
    font-size: var(--text-caption);
    line-height: var(--leading-compact);
  }

  .roles span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contact-list {
    display: grid;
    gap: var(--space-2);
    font-size: var(--text-small);
  }

  .contact-list a,
  .contact-row {
    display: grid;
    min-height: var(--space-6);
    grid-template-columns: var(--space-5) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    color: inherit;
    line-height: var(--leading-ui);
    text-decoration: none;
  }

  .contact-list a {
    width: fit-content;
    transition:
      color var(--motion-duration-fast) var(--motion-ease-standard),
      transform var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .contact-list a:hover {
    color: var(--color-primary);
    transform: translateX(var(--space-1));
  }

  .contact-list a:focus-visible {
    color: var(--color-primary);
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .contact-icon {
    display: grid;
    width: var(--space-4);
    place-items: center;
    justify-self: center;
  }

  .contact-icon :global(svg) {
    display: block;
    width: 1em;
    height: 1em;
  }

  .email-icon :global(svg) {
    transform: scale(1.12);
  }

  .unavailable {
    color: var(--color-muted);
  }

  @media (max-width: 34rem) {
    .profile-card {
      width: min(
        var(--profile-card-width),
        calc(100vw - (var(--profile-card-boundary) * 2))
      );
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-surface,
    .profile-card.dragging .card-surface,
    .profile-card.inertial .card-surface,
    .contact-list a {
      transform: none;
      transition-duration: var(--motion-duration-immediate);
    }
  }

  :global(html[data-motion="reduced"]) .card-surface,
  :global(html[data-motion="off"]) .card-surface {
    --card-rotate-z: 0deg;
  }

  @media (forced-colors: active) {
    .card-surface {
      border: 1px solid CanvasText;
      background: Canvas;
      box-shadow: none;
      backdrop-filter: none;
      transform: none;
    }
  }
</style>
