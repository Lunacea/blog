<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import ContentIndexPage from "$lib/components/ContentIndexPage.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
</script>
<PageHead
  title={`Works — ${siteConfig.name}`}
  description="実装、研究、空間表現を、役割と技術、検証した問いとともに記録します。"
  path="/works"
/>
<ContentIndexPage
  eyebrow="Catalog / Constructed"
  title="Works"
  description="作ったものだけでなく、問題、役割、設計判断、検証と反省をケーススタディとして示します。"
  entries={data.entries}
/>
