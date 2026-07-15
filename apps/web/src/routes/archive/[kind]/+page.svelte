<script lang="ts">
  import { siteConfig } from "@lunacea/config";
  import ContentIndexPage from "$lib/components/ContentIndexPage.svelte";
  import PageHead from "$lib/components/PageHead.svelte";
  let { data } = $props();
  const labels = {
    photos: ["Photographs", "光、表面、季節の変化を、場所の断片として記録します。"],
    places: ["Places", "訪れた土地を、座標だけでなく観察と記憶から残します。"],
    wines: ["Wines", "味と香り、その時間の周囲にあったものを短く記録します。"],
    moments: ["Moments", "分類しきれない短い出来事を、消える前に留めます。"]
  };
  const label = $derived(labels[data.kind as keyof typeof labels]);
</script>
<PageHead
  title={`${label[0]} — ${siteConfig.name}`}
  description={label[1]}
  path={`/archive/${data.kind}`}
/>
<ContentIndexPage
  eyebrow="Archive / Fragments"
  title={label[0]}
  description={label[1]}
  entries={data.entries}
/>
