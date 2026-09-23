<script lang="ts">
  import { Icon, interfaceIcons, socialIcons } from "@lunacea/ui/icons";
  import { cn } from "@lunacea/ui/utils";

  let {
    title,
    url,
    via,
    hashtags = [],
    variant = "inline",
    class: className = "",
  }: {
    title: string;
    url: string;
    /** 著者のハンドル（@ なし）。X が下書きに "via @handle" を付ける。 */
    via?: string;
    /** インテントはカンマ区切りの素の一覧を期待するので、# を付けずに渡す。 */
    hashtags?: readonly string[];
    /** `rail` は側柱が狭くラベルが入らない場所でアイコンだけにする。 */
    variant?: "inline" | "rail";
    class?: string;
  } = $props();

  /** X の投稿インテント（text, url, via, hashtags）。下書きが開くだけで、投稿は行わない。 */
  const xHref = $derived.by(() => {
    const tags = hashtags.map((tag) => tag.replace(/^#/u, "").replaceAll(/\s+/gu, "")).filter(
      Boolean,
    );
    const parameters = [
      `text=${encodeURIComponent(title)}`,
      `url=${encodeURIComponent(url)}`,
    ];
    if (via) parameters.push(`via=${encodeURIComponent(via.replace(/^@/u, ""))}`);
    if (tags.length) {
      parameters.push(`hashtags=${encodeURIComponent(tags.slice(0, 3).join(","))}`);
    }
    return `https://x.com/intent/post?${parameters.join("&")}`;
  });

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // 共有シートのキャンセルは失敗ではないのでクリップボードに落とす。
      }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
  }

  const rail = $derived(variant === "rail");
  const action = $derived(cn(
    /*
      渡す動作なので、文字が一字ずつ上へ送られて同じ字に入れ替わる（スロット）。
      同時に下からインクが薄く満ちて、文字を送る方向と揃える。
    */
    "group/share relative isolate inline-flex min-h-control items-center gap-x-(--space-2) overflow-hidden rounded-ui-card border border-rule px-(--space-4) font-stretch-84% text-folio leading-none tracking-folio uppercase text-ink no-underline pressable transition-[translate,scale,color,background-color,border-color] hover:border-ink hover:no-underline focus-visible:border-ink active:border-ink active:bg-ink active:text-canvas [&_svg]:size-(--space-4)",
    "before:absolute before:inset-0 before:-z-1 before:origin-bottom before:scale-y-0 before:bg-ink before:opacity-[.07] before:transition-[scale] before:duration-(--motion-duration-base) before:ease-signature hover:before:scale-y-100 focus-visible:before:scale-y-100 motion-off:before:transition-none",
  ));
  const label = $derived(rail ? "@max-[96px]:sr-only" : "");
</script>

{#snippet slot(text: string)}
  <!-- 読み上げには素の語を渡し、目に見えるほうは一字ずつの箱にする。 -->
  <span class="sr-only">{text}</span>
  <span class="inline-flex" aria-hidden="true">
    {#each text.split("") as glyph, index}
      <span class="grid h-[1em] overflow-hidden [grid-template-rows:1fr]" style={`--slot-index:${index}`}>
        <span class="[grid-area:1/1] transition-[translate] duration-(--motion-duration-base) ease-signature [transition-delay:calc(var(--slot-index)*28ms)] group-hover/share:-translate-y-full group-focus-visible/share:-translate-y-full motion-off:transition-none">{glyph}</span>
        <span class="[grid-area:1/1] translate-y-full transition-[translate] duration-(--motion-duration-base) ease-signature [transition-delay:calc(var(--slot-index)*28ms)] group-hover/share:translate-y-0 group-focus-visible/share:translate-y-0 motion-off:transition-none">{glyph}</span>
      </span>
    {/each}
  </span>
{/snippet}

<nav class={cn("share-actions flex flex-wrap items-center gap-(--space-2)", rail && "max-read-wide:flex-col max-read-wide:items-stretch max-read-wide:flex-nowrap", className)} aria-label="この記事を共有">
  <button class={cn(action, rail && "@max-[96px]:justify-center @max-[96px]:px-0", "cursor-pointer bg-transparent")} type="button" onclick={shareLink}>
    <Icon name={interfaceIcons.externalLink} />
    <span class={label}>{@render slot("Share")}</span>
  </button>
  <a class={cn(action, rail && "@max-[96px]:justify-center @max-[96px]:px-0")} href={xHref} target="_blank" rel="noopener noreferrer">
    <Icon name={socialIcons.x} />
    <span class={label}>{@render slot("Post")}</span>
  </a>
</nav>
