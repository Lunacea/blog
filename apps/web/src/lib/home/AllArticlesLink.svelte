<script lang="ts">
  import { ForwardGlyph } from "@lunacea/ui/icons";
  import { cn } from "@lunacea/ui/utils";

  let { class: className = "" }: { class?: string } = $props();
  let anchor: HTMLAnchorElement | null = null;
  let host = $state<HTMLElement | null>(null);
  let live = $state(false);
  let scene:
    | { setHover(v: boolean): void; setPointer(x: number, y: number): void; destroy(): void }
    | undefined;
  let failed = false;

  const eligible = () =>
    document.documentElement.dataset.motion === "full" &&
    !matchMedia("(forced-colors: active)").matches &&
    !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) > 2;

  /* 触られて初めて載せる。導線なので、場を作る前から押せることを優先する。 */
  async function ensure() {
    if (scene || failed || !host || !eligible()) return;
    try {
      const { mountInkButton } = await import("./ink-button.ts");
      if (!host || !anchor) return;
      const owner = anchor;
      scene = mountInkButton(
        host,
        () => {
          failed = true;
          scene?.destroy();
          scene = undefined;
          owner.style.removeProperty("--ink-hidden");
          live = false;
        },
        (level) => owner.style.setProperty("--ink-hidden", `${(1 - level) * 100}%`),
      );
      live = true;
    } catch {
      failed = true;
    }
  }

  function place(anchor: HTMLElement, event: PointerEvent) {
    const box = anchor.getBoundingClientRect();
    scene?.setPointer((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
  }

  function track(event: PointerEvent) {
    place(event.currentTarget as HTMLElement, event);
  }

  /* currentTarget は待っている間に失われるので、先に掴んでおく。 */
  async function enter(event: PointerEvent) {
    const anchor = event.currentTarget as HTMLElement;
    await ensure();
    place(anchor, event);
    scene?.setHover(true);
  }

  $effect(() => () => {
    scene?.destroy();
    anchor?.style.removeProperty("--ink-hidden");
  });
</script>

<a
  class={cn(
    "group/all relative isolate inline-flex min-h-control items-center overflow-hidden rounded-ui-card border border-rule bg-(--color-glass) px-(--space-10) py-(--space-5) backdrop-blur-glass font-stretch-88% text-small leading-none font-strong tracking-label uppercase no-underline pressable [--press-scale:0.98] [--glyph-stroke:2.4] hover:no-underline",
    className,
  )}
  href="/articles"
  bind:this={anchor}
  onpointerenter={enter}
  onpointermove={track}
  onpointerleave={() => scene?.setHover(false)}
  onfocusin={() => {
    void ensure().then(() => scene?.setHover(true));
  }}
  onfocusout={() => scene?.setHover(false)}
>
  <!-- WebGL が載らないときの塗り。載ったら退いて、インクに場所を譲る。 -->
  <span
    class={cn(
      "pointer-events-none absolute inset-0 -z-1 origin-left scale-x-0 bg-ink transition-[scale] duration-(--motion-duration-base) ease-signature group-hover/all:scale-x-100 group-focus-visible/all:scale-x-100 motion-off:duration-(--motion-duration-immediate)",
      live && "hidden",
    )}
    aria-hidden="true"
  ></span>
  <span class="pointer-events-none absolute inset-0 -z-1" bind:this={host} aria-hidden="true"></span>

  <span class="pointer-events-none relative grid">
    <span class="col-start-1 row-start-1 flex items-center gap-x-(--space-4) text-ink" data-ink-label="base">
      <span>All articles</span>
      <ForwardGlyph />
    </span>
    <span
      class={cn(
        "col-start-1 row-start-1 flex items-center gap-x-(--space-4) text-canvas",
        live
          ? "[clip-path:inset(0_var(--ink-hidden,100%)_0_0)]"
          : "[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-(--motion-duration-base) ease-signature group-hover/all:[clip-path:inset(0)] group-focus-visible/all:[clip-path:inset(0)] motion-off:duration-(--motion-duration-immediate)",
      )}
      data-ink-label="fill"
      aria-hidden="true"
    >
      <span>All articles</span>
      <ForwardGlyph />
    </span>
  </span>
</a>
