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
    portrait,
    github,
    x,
    email,
    class: className = "",
  }: {
    name: string;
    role: string;
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
   * Picking the card up is a pointer gesture, so mouse, pen and touch all share one path. The
   * listeners are bound to the node rather than declared as attributes: dragging is decoration on
   * a non-interactive object, it always springs back, and no ARIA role describes it honestly.
   */
  const reach = 160;
  let card = $state<HTMLElement | null>(null);
  let held = $state(false);
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
    if (document.documentElement.dataset.motion !== "full") return;
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

  $effect(() => {
    const node = card;
    if (!node) return;
    node.addEventListener("pointerdown", grab);
    node.addEventListener("pointermove", move, { passive: false });
    node.addEventListener("pointerup", release);
    node.addEventListener("pointercancel", release);
    return () => {
      node.removeEventListener("pointerdown", grab);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", release);
      node.removeEventListener("pointercancel", release);
    };
  });
</script>

<div
  class={cn(
    // The card names its own ink; a registered custom property change does not reliably
    // invalidate a long `color: inherit` chain.
    "profile-card group/card grid aspect-[91/55] min-h-fit w-full grid-rows-[1fr_auto] gap-y-(--space-4) rounded-ui-card border border-rule bg-paper p-(--space-6) text-ink shadow-ui-profile",
    "translate-x-(--card-x) translate-y-(--card-y) rotate-(--card-tilt) transition-[rotate,translate,border-color,box-shadow] duration-(--motion-duration-slow) ease-spring",
    "hover:-translate-y-(--space-2) hover:rotate-0 hover:border-ink hover:shadow-ui-overlay focus-within:rotate-0 focus-within:border-ink",
    // While it is being carried it must follow the finger exactly, with nothing easing it.
    "cursor-grab touch-pan-y select-none data-[held=true]:cursor-grabbing data-[held=true]:touch-none data-[held=true]:rotate-0 data-[held=true]:shadow-ui-overlay data-[held=true]:transition-none data-[held=true]:hover:translate-y-(--card-y)",
    "motion-off:cursor-auto motion-off:transition-none home-opening:animate-card-arrive max-sm:p-(--space-5)",
    className,
  )}
  style={`--card-x:${offsetX}px;--card-y:${offsetY}px`}
  data-held={held}
  bind:this={card}
>
  <div class="flex min-w-0 items-center gap-x-(--space-4) self-center">
    {#if portrait?.src}
      <img
        class="size-(--profile-card-media) max-w-[24%] shrink-0 object-contain"
        src={portrait.src}
        alt={portrait.alt}
        width={portrait.width}
        height={portrait.height}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    {/if}
    <div class="min-w-0">
      <p class="m-0 font-stretch-104% text-h3 leading-tight font-strong tracking-heading wrap-anywhere uppercase">{name}</p>
      <p class="mt-(--space-2) mb-0 font-stretch-84% text-folio leading-snug tracking-folio text-quiet uppercase">{role}</p>
    </div>
  </div>

  <nav class="flex flex-wrap items-center gap-x-(--space-4) gap-y-(--space-2) border-t border-rule pt-(--space-3)" aria-label="連絡先">
    {#each contacts as contact}
      <a
        class="inline-grid size-(--space-8) place-items-center text-ink no-underline transition-[translate] duration-(--motion-duration-fast) ease-spring hover:-translate-y-0.5 hover:no-underline focus-visible:-translate-y-0.5 motion-off:transition-none [&_svg]:size-(--space-5)"
        href={contact.href}
        rel={contact.rel}
        aria-label={contact.label}
      >
        <Icon name={contact.icon} />
      </a>
    {/each}
  </nav>
</div>
