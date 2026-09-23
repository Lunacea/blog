<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils.ts";

  let {
    children,
    contentId,
    canonicalUrl,
    kind,
    embedded = false,
    hasSequence = false,
    class: className = "",
  }: {
    children: Snippet;
    contentId: string;
    canonicalUrl: string;
    kind: "article" | "work" | "diary" | "photo" | "place" | "wine" | "moment";
    embedded?: boolean;
    hasSequence?: boolean;
    class?: string;
  } = $props();
</script>

<article
  class={cn(
    "content-detail-view",
    kind === "article" && "article-record",
    kind === "work" && "work-record",
    kind !== "article" && kind !== "work" && "archive-record",
    className,
  )}
  data-content-id={contentId}
  data-content-kind={kind}
  data-embedded={embedded}
  data-has-sequence={hasSequence}
  data-canonical-url={canonicalUrl}
>
  {@render children()}
</article>
