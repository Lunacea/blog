<script lang="ts">
  import { Icon, interfaceIcons, socialIcons } from "../icons/index.ts";
  import { cn } from "../utils.ts";

  let { title, url, class: className = "" }: { title: string; url: string; class?: string } = $props();
  // Both parameters are sent, so the draft opens with the headline and the link already in it.
  const xHref = $derived(
    `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  );

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
    "inline-flex min-h-control items-center gap-x-(--space-2) rounded-ui-card border border-rule px-(--space-4) font-stretch-84% text-folio leading-none tracking-folio uppercase text-ink no-underline transition-colors duration-(--motion-duration-fast) ease-standard hover:border-ink hover:no-underline focus-visible:border-ink [&_svg]:size-(--space-4)";
</script>

<nav class={cn("share-actions flex flex-wrap items-center gap-(--space-2)", className)} aria-label="この記事を共有">
  <button class={cn(action, "cursor-pointer bg-transparent")} type="button" onclick={shareLink}>
    <Icon name={interfaceIcons.externalLink} />
    <span>{status ? "Copied" : "Share"}</span>
  </button>
  <a class={action} href={xHref} target="_blank" rel="noreferrer">
    <Icon name={socialIcons.x} />
    <span>Post</span>
  </a>
  <p class="sr-only" aria-live="polite">{status}</p>
</nav>
