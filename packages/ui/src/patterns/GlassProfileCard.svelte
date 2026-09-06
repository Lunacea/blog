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
    });
  }

  function resetTilt() {
    cancelAnimationFrame(tiltFrame);
    surface.style.removeProperty("--card-rotate-x");
    surface.style.removeProperty("--card-rotate-y");
    surface.style.removeProperty("--card-rotate-z");
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
  class="profile-card group/profile relative w-[min(var(--profile-card-width),calc(100vw-(var(--layout-gutter)*2)))] max-w-(--layout-grid-wide) touch-pan-y [--card-x:0px] [--card-y:0px] [transform:translate3d(var(--card-x),var(--card-y),0)] max-xs:w-[min(var(--profile-card-width),calc(100vw-(var(--profile-card-boundary)*2)))]"
  data-dragging={dragging}
  data-inertial={inertial}
  data-introduced={introduced}
  data-cursor="drag"
  data-cursor-label="Drag it!"
  bind:this={card}
>
  <div
    class="card-surface relative isolate grid origin-[48%_52%] transform-3d gap-(--profile-card-gap) overflow-hidden rounded-sharp border border-rule bg-paper p-(--profile-card-padding) shadow-paper before:pointer-events-none before:absolute before:inset-0 before:bg-[url('/textures/editorial-noise.svg')] before:bg-size-[192px_192px] before:bg-repeat before:opacity-30 before:mix-blend-multiply before:content-[''] theme-dark:before:opacity-20 theme-dark:before:invert theme-dark:before:mix-blend-screen forced-colors:before:hidden print:before:hidden *:relative [--card-rotate-x:0deg] [--card-rotate-y:0deg] [--card-rotate-z:var(--profile-card-resting-tilt)] [transform:perspective(60rem)_rotateX(var(--card-rotate-x))_rotateY(var(--card-rotate-y))_rotateZ(var(--card-rotate-z))] transition-transform duration-(--motion-duration-fast) ease-enter group-data-[introduced=true]/profile:animate-profile-card-arrive group-data-[dragging=true]/profile:animate-none group-data-[dragging=true]/profile:[transform:perspective(60rem)_rotateX(var(--card-rotate-x))_rotateY(var(--card-rotate-y))_rotateZ(var(--card-rotate-z))_scale(1.012)] group-data-[dragging=true]/profile:transition-none group-data-[inertial=true]/profile:animate-none group-data-[inertial=true]/profile:[transform:perspective(60rem)_rotateX(var(--card-rotate-x))_rotateY(var(--card-rotate-y))_rotateZ(var(--card-rotate-z))_scale(1.006)] motion-reduced:[--card-rotate-z:0deg] motion-reduced:transform-none motion-reduced:duration-(--motion-duration-immediate) motion-off:[--card-rotate-z:0deg] forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:shadow-none forced-colors:backdrop-blur-none forced-colors:transform-none"
    bind:this={surface}
    onanimationend={finishIntroduction}
  >
    <header class="identity grid grid-cols-[var(--profile-card-media)_minmax(0,1fr)] items-center gap-(--space-3)">
      <div class="profile-media w-(--profile-card-media) cursor-grab select-none group-data-[dragging=true]/profile:cursor-grabbing [&_.media-slot]:aspect-square [&_.media-slot]:rounded-none [&_[data-asset-placeholder]]:aspect-square [&_[data-asset-placeholder]]:rounded-none [&_img]:object-contain [&_img]:filter-none">
        <MediaSlot {asset} showPlaceholder={!asset.src} label="Profile character / replace" />
      </div>
      <div class="identity-copy min-w-0">
        <h2 class="m-0 font-serif text-h3 leading-snug font-regular" id="about-title">{name}</h2>
        <p class="roles mt-(--space-1) mb-0 grid overflow-hidden text-caption leading-compact text-quiet">
          {#each roles as role}
            <span class="overflow-hidden text-ellipsis whitespace-nowrap">{role}</span>
          {/each}
        </p>
      </div>
    </header>

    <nav class="contact-list grid gap-(--space-2) text-small [&_a]:grid [&_a]:min-h-(--space-6) [&_a]:w-fit [&_a]:grid-cols-[var(--space-5)_minmax(0,1fr)] [&_a]:items-center [&_a]:gap-(--space-2) [&_a]:leading-ui [&_a]:text-inherit [&_a]:no-underline [&_a]:transition-[color,transform] [&_a]:duration-(--motion-duration-fast) [&_a]:ease-standard [&_a]:hover:translate-x-(--space-1) [&_a]:hover:text-action [&_a]:focus-visible:text-action [&_a]:focus-visible:outline-none [&_a]:focus-visible:shadow-(--focus-ring) motion-reduce:[&_a]:transform-none motion-reduce:[&_a]:duration-(--motion-duration-immediate) [&_.contact-row]:grid [&_.contact-row]:min-h-(--space-6) [&_.contact-row]:grid-cols-[var(--space-5)_minmax(0,1fr)] [&_.contact-row]:items-center [&_.contact-row]:gap-(--space-2) [&_.contact-row]:leading-ui [&_.contact-icon]:grid [&_.contact-icon]:w-(--space-4) [&_.contact-icon]:place-items-center [&_.contact-icon]:justify-self-center [&_.contact-icon_svg]:size-[1em] [&_.email-icon_svg]:scale-[1.12] [&_.unavailable]:text-quiet" aria-label="連絡先">
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
