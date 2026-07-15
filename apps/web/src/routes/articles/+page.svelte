<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import ContentIndexPage from "$lib/components/ContentIndexPage.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
</script>
<PageHead
  title={`Articles — ${siteConfig.name}`}
  description="技術、研究、設計、考察を、完成度と更新状態を含む資料目録として残します。"
  path="/articles"
/>
<ContentIndexPage
  eyebrow="Catalog / Knowledge"
  title="Articles"
  description="技術、研究、設計、考察を、完成度と更新状態を含む資料目録として残します。"
  entries={data.entries}
/>
