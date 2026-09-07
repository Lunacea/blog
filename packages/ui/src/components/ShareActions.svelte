<script lang="ts">
  import { Icon, interfaceIcons, socialIcons } from "../icons/index.ts";
  import { cn } from "../utils.ts";

  let {
    title,
    url,
    via,
    hashtags = [],
    class: className = "",
  }: {
    title: string;
    url: string;
    /** The author's handle, without the @; X appends "via @handle" to the draft. */
    via?: string;
    /** Sent without their hashes, as the intent expects a plain comma-separated list. */
    hashtags?: readonly string[];
    class?: string;
  } = $props();

  /**
   * The post intent as X documents it: text, url, via and hashtags, each URL-encoded, opened in a
   * new window. The draft therefore arrives with the headline, the link and the attribution
   * already in it, and nothing is posted without the reader confirming it on X.
   */
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

  /** The generic action is the one most readers want: hand the link to whatever they use. */
  let status = $state("");
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // A dismissed share sheet is not a failure; fall through to the clipboard.
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

  const action =
    "inline-flex min-h-control items-center gap-x-(--space-2) rounded-ui-card border border-rule px-(--space-4) font-stretch-84% text-folio leading-none tracking-folio uppercase text-ink no-underline pressable hover:border-ink hover:no-underline focus-visible:border-ink active:border-ink active:bg-ink active:text-canvas [&_svg]:size-(--space-4)";
</script>

<nav class={cn("share-actions flex flex-wrap items-center gap-(--space-2)", className)} aria-label="この記事を共有">
  <button class={cn(action, "cursor-pointer bg-transparent")} type="button" onclick={shareLink}>
    <Icon name={interfaceIcons.externalLink} />
    <span>{status ? "Copied" : "Share"}</span>
  </button>
  <a class={action} href={xHref} target="_blank" rel="noopener noreferrer">
    <Icon name={socialIcons.x} />
    <span>Post</span>
  </a>
  <p class="sr-only" aria-live="polite">{status}</p>
</nav>
