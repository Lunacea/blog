<script lang="ts">
  import { Icon, socialIcons } from "../icons/index.ts";
  import { actionVariants } from "../primitives/index.ts";

  let { title, url }: { title: string; url: string } = $props();
  const text = $derived(`${title}\n${url}`);
  const xHref = $derived(`https://x.com/intent/post?text=${encodeURIComponent(text)}`);
</script>

<nav class="share-actions flex items-center" aria-label="SNSでシェア">
  <a class={actionVariants("outline", "min-h-10 text-(length:--text-caption)")} href={xHref} target="_blank" rel="noreferrer">
    <Icon name={socialIcons.x} />
    <span>Share</span>
  </a>
</nav>
