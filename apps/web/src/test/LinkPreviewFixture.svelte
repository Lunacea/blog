<script lang="ts">
  import LinkCard from "$ui/components/LinkCard.svelte";
  import { provideLinkPreviews } from "$ui/components/link-preview-context.ts";

  const href = "https://example.com/article";
  provideLinkPreviews(() => ({
    [href]: {
      href,
      site: "example.com",
      title: "Cached article title",
      description: "Cached article description",
      image: "/images/ogp/example.webp",
    },
  }));
</script>

<LinkCard {href} />
