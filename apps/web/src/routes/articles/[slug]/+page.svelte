<script lang="ts">
  import ContentDetail from "$lib/components/ContentDetail.svelte";
  let { data } = $props();
</script>
<ContentDetail {...data} />
