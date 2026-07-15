<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import ContentIndexPage from "$lib/components/ContentIndexPage.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
</script>
<PageHead
  title={`${data.tag} — Tags — ${siteConfig.name}`}
  description={`「${data.tag}」に関連する資料を、種別を越えて表示します。`}
  path={`/tags/${encodeURIComponent(data.tag)}`}
/>
<ContentIndexPage
  eyebrow="Cross reference / Tag"
  title={data.tag}
  description={"「" + data.tag + "」に関連する資料を、種別を越えて表示します。"}
  entries={data.entries}
  showType
/>
