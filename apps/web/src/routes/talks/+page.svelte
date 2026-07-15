<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import ContentIndexPage from "$lib/components/ContentIndexPage.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
</script>
<PageHead
  title={`Talks — ${siteConfig.name}`}
  description="登壇、ポスター、ワークショップの資料と、その場で共有した問いを残します。"
  path="/talks"
/>
<ContentIndexPage
  eyebrow="Catalog / Shared"
  title="Talks"
  description="登壇、ワークショップ、ポスター、研究発表と、その場で共有した設計判断を記録します。"
  entries={data.entries}
/>
