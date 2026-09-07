<script lang="ts">
  import type { AuthoredMedia } from "@lunacea/config";
  import { Icon, socialIcons } from "../icons/index.ts";
  import { cn } from "../utils.ts";

  /**
   * The introduction is a business card: the proportions are the Japanese 91×55mm standard, and it
   * rests at a slight clockwise tilt as though it were set down on the page. Hover and focus
   * straighten and lift it, and it can be picked up and moved, so the object reads as physical
   * rather than decorative.
   */
  let {
    name,
    role,
    bio,
    portrait,
    github,
    x,
    email,
    class: className = "",
  }: {
    name: string;
    role: string;
    bio?: string;
    portrait?: AuthoredMedia;
    github?: string;
    x?: string;
    email?: string;
    class?: string;
  } = $props();

  const contacts = $derived([
    github ? { label: "GitHub", href: github, icon: socialIcons.github, rel: "me" } : null,
    x ? { label: "X", href: x, icon: socialIcons.x, rel: "me" } : null,
    email
      ? { label: "Email", href: `mailto:${email}`, icon: socialIcons.email, rel: undefined }
      : null,
  ].filter((entry) => entry !== null));

  /**
   * Picking the card up is a pointer gesture, so mouse, pen and touch all share one path, and the
   * keyboard gets the same object through the arrow keys. The listeners are bound to the node
   * rather than declared as attributes: moving the card is decoration on a non-interactive
   * object, it always returns to its mark, and no ARIA role describes the gesture honestly.
   */
  const reach = 160;
  const step = 12;
  let card = $state<HTMLElement | null>(null);
  /** Only the hydrated card can be moved, so only it announces itself as movable. */
  let movable = $state(false);
  let held = $state(false);
  let nudged = $state(false);
  let offsetX = $state(0);
  let offsetY = $state(0);
  let pointer: number | null = null;
  let fromX = 0;
  let fromY = 0;
  let originX = 0;
  let originY = 0;

  function clamp(value: number) {
    return Math.max(-reach, Math.min(reach, value));
  }

  function grab(event: PointerEvent) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    // A press that starts on a contact is a press on that contact, not on the card.
    if (event.target instanceof Element && event.target.closest("a")) return;
    nudged = false;
    pointer = event.pointerId;
    card?.setPointerCapture(event.pointerId);
    fromX = event.clientX;
    fromY = event.clientY;
    originX = offsetX;
    originY = offsetY;
    held = true;
  }

  function move(event: PointerEvent) {
    if (!held || event.pointerId !== pointer) return;
    event.preventDefault();
    offsetX = clamp(originX + event.clientX - fromX);
    offsetY = clamp(originY + event.clientY - fromY);
  }

  function release(event: PointerEvent) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    held = false;
    // It springs back to where it was set down: the composition is never left broken.
    offsetX = 0;
    offsetY = 0;
  }

  const steps: Record<string, readonly [number, number]> = {
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
  };

  function nudge(event: KeyboardEvent) {
    // A focused contact is being used, not the card, so its keys are left alone.
    if (event.target !== card) return;
    if (event.key === "Escape" || event.key === "Home") {
      if (!offsetX && !offsetY) return;
      event.preventDefault();
      settle();
      return;
    }
    const move = steps[event.key];
    if (!move) return;
    // Otherwise the page would scroll out from under the card being moved.
    event.preventDefault();
    nudged = true;
    offsetX = clamp(offsetX + move[0]);
    offsetY = clamp(offsetY + move[1]);
  }

  /** Leaving the card puts the composition back the way the drag does. */
  function settle() {
    nudged = true;
    offsetX = 0;
    offsetY = 0;
  }

  $effect(() => {
    const node = card;
    if (!node) return;
    // The group really is operable once these listeners exist, and it is not focusable before
    // then: without them there would be nothing for a keyboard to do here.
    node.tabIndex = 0;
    movable = true;
    node.addEventListener("pointerdown", grab);
    node.addEventListener("pointermove", move, { passive: false });
    node.addEventListener("pointerup", release);
    node.addEventListener("pointercancel", release);
    node.addEventListener("keydown", nudge);
    node.addEventListener("blur", settle);
    return () => {
      node.removeAttribute("tabindex");
      movable = false;
      node.removeEventListener("pointerdown", grab);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", release);
      node.removeEventListener("pointercancel", release);
      node.removeEventListener("keydown", nudge);
      node.removeEventListener("blur", settle);
    };
  });
</script>

<div
  class={cn(
    // The card names its own ink; a registered custom property change does not reliably
    // invalidate a long `color: inherit` chain.
    "profile-card group/card grid w-full grid-cols-1 grid-rows-[1fr_auto] gap-y-(--space-3) rounded-ui-card border border-rule bg-paper p-(--space-5) text-ink shadow-ui-profile max-sm:gap-y-(--space-2)",
    "translate-x-(--card-x) translate-y-(--card-y) rotate-(--card-tilt) transition-[rotate,translate,border-color,box-shadow] duration-(--motion-duration-slow) ease-spring",
    "hover:-translate-y-(--space-2) hover:rotate-0 hover:border-ink hover:shadow-ui-overlay focus-within:rotate-0 focus-within:border-ink",
    // While it is being carried it must follow the finger exactly, with nothing easing it.
    "cursor-grab touch-pan-y select-none data-[held=true]:cursor-grabbing data-[held=true]:touch-none data-[held=true]:rotate-0 data-[held=true]:shadow-ui-overlay data-[held=true]:transition-none data-[held=true]:hover:translate-y-(--card-y)",
    // Arrow keys answer at once; the slow spring belongs to the tilt, not to a repeated key.
    "data-[nudged=true]:duration-(--motion-duration-fast) focus-visible:rotate-0 focus-visible:border-ink",
    "motion-off:cursor-auto motion-off:transition-none home-opening:animate-card-arrive max-sm:p-(--space-4)",
    className,
  )}
  style={`--card-x:${offsetX}px;--card-y:${offsetY}px`}
  data-held={held}
  data-nudged={nudged}
  role="group"
  aria-label={`${name}の名刺`}
  aria-describedby={movable ? "profile-card-hint" : undefined}
  bind:this={card}
>
  <!--
    The printed 91×55 proportion is a floor, not a cage: this spacer spans both rows, so the card
    keeps the shape of a business card at every width and only grows when the introduction needs
    more room than the shape allows. Setting `aspect-ratio` on the card itself cannot do that — a
    flex item takes its height from the ratio and its content spills out of the border.
  -->
  <span class="pointer-events-none col-start-1 row-span-2 row-start-1 aspect-[91/55] w-full" aria-hidden="true"></span>

  <div class="col-start-1 row-start-1 grid min-w-0 gap-y-(--space-3) self-center max-sm:gap-y-(--space-2)">
    <div class="flex min-w-0 items-center gap-x-(--space-4)">
      {#if portrait?.src}
        <picture class="contents">
          {#each portrait.sources ?? [] as source}
            <source srcset={source.srcset} type={source.type} media={source.media} />
          {/each}
          <!-- The mark is above the fold and part of the opening, so it is fetched with the
               document rather than waiting for the card to animate in. -->
          <img
            class="size-(--profile-card-media) max-w-[24%] shrink-0 object-contain"
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            draggable="false"
          />
        </picture>
      {/if}
      <div class="min-w-0">
        <p class="m-0 font-stretch-104% text-h3 leading-tight font-strong tracking-heading wrap-anywhere uppercase">{name}</p>
        <p class="mt-(--space-2) mb-0 font-stretch-84% text-folio leading-snug tracking-folio text-quiet uppercase">{role}</p>
      </div>
    </div>
    {#if bio}
      <p class="m-0 max-w-[38ch] text-caption leading-copy text-quiet">{bio}</p>
    {/if}
  </div>

  {#if movable}
    <p class="sr-only" id="profile-card-hint">ドラッグ、または矢印キーで動かせます。Escapeで元の位置に戻ります。</p>
  {/if}

  <nav class="col-start-1 row-start-2 flex flex-wrap items-center gap-x-(--space-4) gap-y-(--space-2) border-t border-rule pt-(--space-3)" aria-label="連絡先">
    {#each contacts as contact}
      <a
        class="inline-grid size-control place-items-center text-ink no-underline transition-[translate,scale] duration-(--motion-duration-fast) ease-spring hover:-translate-y-0.5 hover:no-underline focus-visible:-translate-y-0.5 active:translate-y-px active:scale-90 motion-off:transition-none [&_svg]:size-(--space-5)"
        href={contact.href}
        rel={contact.rel}
        aria-label={contact.label}
      >
        <Icon name={contact.icon} />
      </a>
    {/each}
  </nav>
</div>
