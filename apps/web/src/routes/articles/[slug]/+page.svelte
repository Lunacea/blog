<script lang="ts">
  import ContentDetail from "$lib/articles/ContentDetail.svelte";
  let { data } = $props();
</script>
<ContentDetail {...data} />
