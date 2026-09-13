<script lang="ts">
  import type { AuthoredMedia } from "@lunacea/config";
  import { Icon, socialIcons } from "../icons/index.ts";
  import { Separator } from "../primitives/index.ts";
  import { cn } from "../utils.ts";

  /**
   * 自己紹介は名刺。比率は 91×55mm で、置かれたように少し右へ傾いている。
   * ホバーとフォーカスで起き上がり、掴んで動かせる。
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
   * 持ち上げはポインタ操作なのでマウス・ペン・タッチが同じ経路を通り、キーボードは矢印キーで扱う。
   * この動きを正しく表す ARIA ロールが存在しないため、宣言ではなくノードに直接束ねる。
   */
  const step = 12;
  let card = $state<HTMLElement | null>(null);
  /** ハイドレーション済みのカードだけが動かせるので、そのときだけ可動であると示す。 */
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

  /*
   * 運べる距離は固定値ではなく窓から測る。3分の1が画面に残ればよく、3分の2まではみ出せる。
   * これより狭いとジェスチャの途中で壁に当たる。移動量は静止時の矩形基準なので、
   * どの幅でも同じ届き方になる。
   */
  let reachLeft = 0;
  let reachRight = 0;
  let reachUp = 0;
  let reachDown = 0;

  function measure() {
    const node = card;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return;
    // 運搬中に矩形を読むため、カード自身の移動分を差し引く。
    const left = box.left - offsetX;
    const top = box.top - offsetY;
    const stay = { x: box.width / 3, y: box.height / 3 };
    reachRight = Math.max(0, innerWidth - left - stay.x);
    reachLeft = Math.max(0, left + box.width - stay.x);
    reachDown = Math.max(0, innerHeight - top - stay.y);
    reachUp = Math.max(0, top + box.height - stay.y);
  }

  function clampX(value: number) {
    return Math.max(-reachLeft, Math.min(reachRight, value));
  }

  function clampY(value: number) {
    return Math.max(-reachUp, Math.min(reachDown, value));
  }

  function grab(event: PointerEvent) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    // 連絡先の上で始まった押下はカードではなくその連絡先への押下。
    if (event.target instanceof Element && event.target.closest("a")) return;
    nudged = false;
    measure();
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
    offsetX = clampX(originX + event.clientX - fromX);
    offsetY = clampY(originY + event.clientY - fromY);
  }

  function release(event: PointerEvent) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    held = false;
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
    // 連絡先にフォーカスがあるときはそのキー操作を奪わない。
    if (event.target !== card) return;
    if (event.key === "Escape" || event.key === "Home") {
      if (!offsetX && !offsetY) return;
      event.preventDefault();
      settle();
      return;
    }
    const move = steps[event.key];
    if (!move) return;
    // 運搬中にページがスクロールしないようにする。
    event.preventDefault();
    nudged = true;
    measure();
    offsetX = clampX(offsetX + move[0]);
    offsetY = clampY(offsetY + move[1]);
  }

  function settle() {
    nudged = true;
    offsetX = 0;
    offsetY = 0;
  }

  $effect(() => {
    const node = card;
    if (!node) return;
    // リスナーが付いて初めて操作可能になるため、それまではフォーカス対象にしない。
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
    // 登録済みカスタムプロパティの変更は長い color: inherit 連鎖を確実に無効化しないため明示する。
    "profile-card group/card relative isolate grid aspect-91/55 w-full grid-cols-1 grid-rows-[auto_1fr_auto] rounded-ui-card border border-rule bg-card p-[clamp(var(--space-3),calc(15vw_-_var(--space-8)_-_var(--space-1)),var(--space-6))] text-ink shadow-ui-profile",
    "data-[held=true]:z-(--z-controls)",
    "translate-x-(--card-x) translate-y-(--card-y) rotate-(--card-tilt) transition-[rotate,translate,border-color,box-shadow] duration-(--motion-duration-slow) ease-spring",
    "hover:-translate-y-(--space-2) hover:rotate-0 hover:border-ink hover:shadow-ui-profile-lifted focus-within:rotate-0 focus-within:border-ink",
    // touch-action はジェスチャ開始時に決まる。持ち上げ後の変更では Safari に間に合わない。
    "cursor-grab touch-none select-none data-[held=true]:cursor-grabbing data-[held=true]:rotate-0 data-[held=true]:shadow-ui-profile-lifted data-[held=true]:transition-none data-[held=true]:hover:translate-y-(--card-y)",
    "data-[nudged=true]:duration-(--motion-duration-fast) focus-visible:rotate-0 focus-visible:border-ink",
    "motion-off:cursor-auto motion-off:transition-none home-opening:animate-card-arrive",
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
  <div
    class={cn(
      "col-start-1 row-start-1 grid min-w-0 items-center gap-y-(--space-3) self-start max-sm:gap-y-(--space-2) max-[26.25rem]:gap-y-(--space-1)",
      portrait?.src && "grid-cols-[var(--profile-card-media)_minmax(0,1fr)] gap-x-(--space-4) max-[26.25rem]:grid-cols-[var(--space-12)_minmax(0,1fr)] max-[26.25rem]:gap-x-(--space-3) max-[25.5rem]:grid-cols-[var(--space-10)_minmax(0,1fr)] max-[25.5rem]:gap-x-(--space-2)",
    )}
  >
    {#if portrait?.src}
      <picture class="col-start-1 row-start-1 block size-(--profile-card-media) max-[26.25rem]:size-(--space-12) max-[25.5rem]:size-(--space-10)">
        {#each portrait.sources ?? [] as source}
          <source srcset={source.srcset} type={source.type} media={source.media} />
        {/each}
        <img
          class="size-full object-contain"
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
    <div class={cn("row-start-1 min-w-0", portrait?.src && "col-start-2")}>
      <p class="m-0 font-stretch-104% text-h3 leading-tight font-strong tracking-heading wrap-anywhere uppercase">{name}</p>
      <p class="mt-(--space-2) mb-0 font-stretch-84% text-folio leading-snug tracking-folio text-quiet uppercase max-[25.5rem]:mt-(--space-1) max-[25.5rem]:font-stretch-75% max-[25.5rem]:tracking-normal">{role}</p>
    </div>
    {#if bio}
      <p class={cn("row-start-2 m-0 max-w-[38ch] text-caption leading-copy text-quiet", portrait?.src && "col-start-2")}>{bio}</p>
    {/if}
  </div>

  {#if movable}
    <p class="sr-only" id="profile-card-hint">ドラッグ、または矢印キーで動かせます。Escapeで元の位置に戻ります。</p>
  {/if}

  <Separator class="col-start-1 row-start-2 self-center" />

  <!-- リンクは行から均等にはみ出して 44px のタップ領域を確保する。 -->
  <nav class="col-start-1 row-start-3 flex h-(--space-5) flex-wrap items-center justify-center gap-x-(--space-4) gap-y-(--space-2)" aria-label="連絡先">
    {#each contacts as contact}
      <a
        class="relative -top-(--space-3) inline-grid size-control place-items-center text-ink no-underline transition-[translate,scale] duration-(--motion-duration-fast) ease-spring hover:-translate-y-0.5 hover:no-underline focus-visible:-translate-y-0.5 active:translate-y-px active:scale-90 motion-off:transition-none [&_svg]:size-(--space-5)"
        href={contact.href}
        rel={contact.rel}
        aria-label={contact.label}
      >
        <Icon name={contact.icon} />
      </a>
    {/each}
  </nav>
</div>
