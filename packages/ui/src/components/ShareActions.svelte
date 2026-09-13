<script lang="ts">
  import { Icon, interfaceIcons, socialIcons } from "../icons/index.ts";
  import { cn } from "../utils.ts";

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

  let status = $state("");
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // 共有シートのキャンセルは失敗ではないのでクリップボードに落とす。
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      status = "リンクをコピーしました";
    } catch {
      status = "コピーできませんでした";
    }
    clearTimeout(timer);
    timer = setTimeout(() => (status = ""), 2400);
  }

  const rail = $derived(variant === "rail");
  const action = $derived(cn(
    "inline-flex min-h-control items-center gap-x-(--space-2) rounded-ui-card border border-rule px-(--space-4) font-stretch-84% text-folio leading-none tracking-folio uppercase text-ink no-underline pressable hover:border-ink hover:no-underline focus-visible:border-ink active:border-ink active:bg-ink active:text-canvas [&_svg]:size-(--space-4)",
    rail && "max-lg:justify-center max-lg:px-0",
  ));
  /** 視覚的にのみ隠す。アクセシブルネームには残す。 */
  const label = $derived(rail ? "max-lg:sr-only" : "");
</script>

<nav class={cn("share-actions flex flex-wrap items-center gap-(--space-2)", rail && "max-lg:flex-col max-lg:items-stretch max-lg:flex-nowrap", className)} aria-label="この記事を共有">
  <button class={cn(action, "cursor-pointer bg-transparent")} type="button" onclick={shareLink}>
    <Icon name={interfaceIcons.externalLink} />
    <span class={label}>{status ? "Copied" : "Share"}</span>
  </button>
  <a class={action} href={xHref} target="_blank" rel="noopener noreferrer">
    <Icon name={socialIcons.x} />
    <span class={label}>Post</span>
  </a>
  <p class="sr-only" aria-live="polite">{status}</p>
</nav>
